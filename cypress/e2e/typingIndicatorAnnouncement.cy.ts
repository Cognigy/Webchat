describe("Typing Indicator Announcement (CGY-3146)", () => {
	const typingRegionSelector = "#webchatTypingIndicatorLiveRegion";
	const messageRegionSelector = "#webchatMessageContainerScreenReaderLiveRegion";
	const defaultText = "A reply is being typed";

	// The announcement fires after typing has been continuously visible for
	// 2000ms (ANNOUNCE_DELAY_MS in history/TypingIndicator.tsx); the indicator
	// itself hides 500ms (messageDelay) after typing stops.
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

	it("survives on/off flapping within the hide tail without restarting the delay", () => {
		// show → brief hide → show within the 500ms visibility tail keeps the
		// indicator visible, so the single announcement still fires on time.
		setTyping("show");
		cy.wait(300);
		setTyping("hide");
		cy.wait(100);
		setTyping("show");

		cy.wait(pastAnnounceDelay - 400);
		cy.get(typingRegionSelector).should("contain.text", defaultText);
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
