describe("Typing Indicator Announcement (CGY-3146)", () => {
	const typingRegionSelector = "#webchatTypingIndicatorLiveRegion";
	const messageRegionSelector = "#webchatMessageContainerScreenReaderLiveRegion";
	const defaultText = "A reply is being typed";

	// The announcement fires after typing has been continuously *active* for
	// 2000ms (ANNOUNCE_DELAY_MS in history/TypingIndicator.tsx); the indicator
	// itself stays visible for messageDelay (default 500ms) after typing stops.
	const pastAnnounceDelay = 2500;

	const setTyping = (typing: "show" | "hide" | "remove") =>
		cy.getWebchat().then(webchat => {
			webchat.store.dispatch({ type: "SET_TYPING", typing });
		});

	beforeEach(() => {
		cy.visitWebchat();
		cy.initMockWebchat();
		cy.openWebchat().startConversation();
	});

	it("pre-mounts an empty status live region with the chat screen", () => {
		// A live region only announces changes to a node already in the
		// accessibility tree, so the region must exist before any typing.
		cy.get(typingRegionSelector)
			.should("exist")
			.should("have.attr", "role", "status")
			.should("be.empty");
	});

	it("announces sustained incoming typing with the default text", () => {
		setTyping("show");

		cy.get(".webchat-typing-indicator").should("be.visible");
		// Not announced immediately — only after the leading delay.
		cy.get(typingRegionSelector).should("be.empty");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("contain.text", defaultText);
	});

	it("does not announce a short typing burst", () => {
		setTyping("show");
		cy.wait(300);
		setTyping("hide");

		// Wait well past the announce delay: the cancelled timer must not fire.
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("be.empty");
	});

	it("stays silent when typing resolves into a message within the delay", () => {
		setTyping("show");
		cy.wait(300);
		// A bot output removes the typing state (message-handler.ts).
		setTyping("remove");
		cy.receiveMessage("Here is your answer");

		cy.wait(pastAnnounceDelay);
		// The message is announced, the typing burst is not.
		cy.get(messageRegionSelector).should("contain.text", "Here is your answer");
		cy.get(typingRegionSelector).should("be.empty");
	});

	it("clears the announcement silently when typing stops, and announces a new session again", () => {
		setTyping("show");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("contain.text", defaultText);

		// Typing stops: the text is removed (removals are not announced), so
		// users browsing the window later don't read stale "typing" text.
		setTyping("hide");
		cy.get(typingRegionSelector).should("be.empty");

		// A new sustained typing session announces again.
		setTyping("show");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("contain.text", defaultText);
	});

	it("does not announce during the visual hide tail once the reply has arrived (messageDelay > announce delay)", () => {
		// Regression: the announce timer must follow real typing state, not
		// the debounced visibility. With behavior.messageDelay above the 2s
		// announce delay, the indicator keeps showing long after typing
		// stopped; a timer keyed off that tail would fire *after* the reply
		// has already been rendered and announced.
		cy.visitWebchat();
		cy.initMockWebchat({
			settings: {
				behavior: {
					messageDelay: 4000,
				},
			},
		});
		cy.openWebchat().startConversation();

		setTyping("show");
		cy.wait(300);
		// A bot output removes the typing state (message-handler.ts) and the
		// reply lands well before the announce delay would have elapsed.
		setTyping("remove");
		cy.receiveMessage("Here is your answer");
		cy.get(messageRegionSelector).should("contain.text", "Here is your answer");

		cy.wait(pastAnnounceDelay);
		// Still inside the 4s hide tail — the dots are visible, the reply is
		// already there, and no "typing" announcement may have fired.
		cy.get(".webchat-typing-indicator").should("be.visible");
		cy.get(typingRegionSelector).should("be.empty");
	});

	it("restarts the delay when typing stops and resumes within the hide tail", () => {
		// show → hide → show within the 500ms visibility tail keeps the dots
		// visible, but the 2s delay counts continuous *typing*, so it starts
		// over from the second "show".
		setTyping("show");
		cy.wait(1500);
		setTyping("hide");
		cy.wait(100);
		setTyping("show");

		// 2.6s after the first "show", but only 1s into the second one.
		cy.wait(1000);
		cy.get(".webchat-typing-indicator").should("be.visible");
		cy.get(typingRegionSelector).should("be.empty");

		cy.wait(pastAnnounceDelay - 1000);
		cy.get(typingRegionSelector).should("contain.text", defaultText);
	});

	it("announces at most once while the indicator stays visible", () => {
		// One bot turn with several delayed messages: typing flaps off/on
		// between outputs within the hide tail. Once announced, the same
		// visible session must not announce again.
		setTyping("show");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector)
			.should("contain.text", defaultText)
			.children()
			.should("have.length", 1)
			.then($first => {
				setTyping("remove");
				cy.receiveMessage("First part");
				cy.wait(100);
				setTyping("show");
				cy.wait(pastAnnounceDelay);

				// Same announcement node — a re-announcement would mount a
				// fresh node (new key) in its place.
				cy.get(typingRegionSelector)
					.children()
					.should("have.length", 1)
					.then($second => {
						expect($second[0]).to.equal($first[0]);
					});
			});
	});

	it("announces the configured custom label", () => {
		cy.visitWebchat();
		cy.initMockWebchat({
			settings: {
				customTranslations: {
					ariaLabels: {
						typingIndicator: "Jens is aan het typen",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		setTyping("show");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("contain.text", "Jens is aan het typen");
	});

	it("renders no live region when the typing indicator is disabled", () => {
		cy.visitWebchat();
		cy.initMockWebchat({
			settings: {
				behavior: {
					enableTypingIndicator: false,
				},
			},
		});
		cy.openWebchat().startConversation();

		setTyping("show");
		cy.wait(pastAnnounceDelay);
		cy.get(typingRegionSelector).should("not.exist");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat screen with an active typing announcement has no detectable a11y violations", () => {
			setTyping("show");
			cy.wait(pastAnnounceDelay);
			cy.get(typingRegionSelector).should("contain.text", defaultText);
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
