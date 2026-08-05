describe("Screen Reader Live Region", () => {
	const liveRegionSelector = "#webchatMessageContainerScreenReaderLiveRegion";

	beforeEach(() => {
		cy.visitWebchat();
		cy.initMockWebchat();
		cy.openWebchat().startConversation();
	});

	it("announces a rendered text message", () => {
		cy.receiveMessage("Hello there");

		// Wait past the 100ms debounce in ScreenReaderLiveRegion.
		cy.wait(500);
		cy.get(liveRegionSelector).should("contain", "Hello there");
	});

	it("does not announce a data-only message that is not rendered in the chat log", () => {
		// A message with no text and a payload that matches no renderable plugin
		// is data-only: it produces no <article> in the DOM.
		cy.receiveMessage("", { some: "data-only-payload" }, "bot");

		cy.wait(500);

		// The data-only message produces no rendered message node...
		cy.get("article").should("have.length", 0);
		// ...and must NOT be announced with the generic fallback.
		cy.get(liveRegionSelector).should("not.contain", "A new message");
	});

	describe("AI-agent notice announcement (CGY-3519)", () => {
		const statusRegionSelector = "#webchatStatusLiveRegion";

		it("announces the default notice when the chat screen appears", () => {
			// beforeEach already opened the chat screen; wait past the 600ms
			// announce delay in ScreenAnnouncer.
			cy.wait(800);
			cy.get(statusRegionSelector).should(
				"contain.text",
				"You're now chatting with an AI Agent.",
			);
		});

		it("announces the configured AIAgentNoticeText", () => {
			cy.visitWebchat();
			cy.initMockWebchat({
				settings: {
					behavior: {
						AIAgentNoticeText: "Je chat met een digitale AI assistent",
					},
				},
			});
			cy.openWebchat().startConversation();

			cy.wait(800);
			cy.get(statusRegionSelector).should(
				"contain.text",
				"Je chat met een digitale AI assistent",
			);
		});

		it("announces the notice only on the first chat-screen visit per open window", () => {
			// beforeEach opened the chat screen — first visit announces.
			cy.wait(800);
			cy.get(statusRegionSelector).should(
				"contain.text",
				"You're now chatting with an AI Agent.",
			);

			// Back to the home screen: announced as a screen change (500ms
			// slide + 600ms announce delay)…
			cy.get("button.webchat-header-back-button").click();
			cy.wait(1300);
			cy.get(statusRegionSelector).should("contain.text", "Chat window home screen");

			// …then return to the chat screen: the home-screen announcement
			// stays — the notice is NOT announced a second time.
			cy.startConversation();
			cy.wait(800);
			cy.get(statusRegionSelector).should("contain.text", "Chat window home screen");
			cy.get(statusRegionSelector).should(
				"not.contain.text",
				"You're now chatting with an AI Agent.",
			);
		});

		it("does not announce anything when the notice is disabled", () => {
			cy.visitWebchat();
			cy.initMockWebchat({
				settings: {
					behavior: {
						enableAIAgentNotice: false,
					},
				},
			});
			cy.openWebchat().startConversation();

			cy.wait(800);
			cy.get(statusRegionSelector).should("be.empty");
		});
	});

	it("skips a data-only message but still announces a later rendered message", () => {
		// Interleave a data-only message between two real text messages. This
		// guards the index-0 blocking edge case: a non-rendered message at the
		// front of the queue must not block announcement of later messages.
		cy.receiveMessage("First message");
		cy.wait(500);
		cy.get(liveRegionSelector).should("contain", "First message");

		cy.receiveMessage("", { some: "data-only-payload" }, "bot");
		cy.receiveMessage("Second message");

		cy.wait(500);

		// Only the two text messages render in the chat log.
		cy.get("article").should("have.length", 2);
		// The later text message is still announced...
		cy.get(liveRegionSelector).should("contain", "Second message");
		// ...and the data-only message never triggered the generic fallback.
		cy.get(liveRegionSelector).should("not.contain", "A new message");
	});
});
