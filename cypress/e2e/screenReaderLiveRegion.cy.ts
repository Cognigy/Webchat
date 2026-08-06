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
		// The notice announces through its own dedicated live region (a
		// sibling of the message region — a shared region would let the next
		// message announcement replace the notice's node, which NVDA then
		// drops). Message announcements hold until the notice is committed,
		// so the notice is always announced BEFORE any message.
		const noticeRegionSelector = "#webchatAIAgentNoticeLiveRegion";
		const noticeText = "You're now chatting with an AI Agent.";

		it("announces the default notice when the chat screen appears", () => {
			// beforeEach already opened the chat screen; wait past the 600ms
			// intro announce delay.
			cy.wait(800);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
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
			cy.get(noticeRegionSelector).should(
				"contain.text",
				"Je chat met een digitale AI assistent",
			);
		});

		it("announces the notice before a message that arrives at the same time", () => {
			// The message lands well inside the intro's 600ms deferral — it
			// must be announced AFTER the intro, not instead of it.
			cy.receiveMessage("Hello there");

			// Before the intro commits, the message announcement is held.
			cy.wait(450);
			cy.get(liveRegionSelector).should("be.empty");

			// Intro commits at ~600ms, the held message right after it.
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
			cy.get(liveRegionSelector).should("contain.text", "Hello there");
		});

		it("does not re-announce the notice when returning to the same conversation", () => {
			// beforeEach opened the chat screen — first visit announces.
			cy.wait(800);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);

			// Back to the home screen (announced via the status region)…
			cy.get("button.webchat-header-back-button").click();
			cy.wait(1300);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "Chat window home screen");

			// …then return to the chat screen: same conversation, silent.
			cy.startConversation();
			cy.wait(800);
			cy.get(noticeRegionSelector).should("not.contain.text", noticeText);
		});

		it("re-announces the notice when starting a new conversation from previous conversations", () => {
			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.visitWebchat();
			cy.initWebchat({
				userId: "user-cgy3519-new",
				sessionId: "session-cgy3519-new",
				channel: "channel-1",
			});
			cy.openWebchat().startConversation();
			cy.get(noticeRegionSelector).should("contain.text", noticeText);

			// Persist the session so it shows up under previous conversations.
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();

			// Start a NEW conversation: a brand-new session announces again
			// (after the session-switch disconnect overlay has closed).
			cy.get("[data-testid='webchat-start-chat-button']").click();
			cy.get(noticeRegionSelector, { timeout: 10000 }).should("contain.text", noticeText);
		});

		it("stays silent when reopening a previous conversation", () => {
			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.visitWebchat();
			cy.initWebchat({
				userId: "user-cgy3519-reopen",
				sessionId: "session-cgy3519-reopen",
				channel: "channel-1",
			});
			cy.openWebchat().startConversation();
			cy.get(noticeRegionSelector).should("contain.text", noticeText);

			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();

			// Reopen the same conversation: not a new session — no notice,
			// even past the intro delay and the reconnect overlay.
			cy.get(".webchat-prev-conversations-item").eq(0).click();
			cy.contains('You said "hello".').should("be.visible");
			cy.wait(1500);
			cy.get(noticeRegionSelector).should("not.contain.text", noticeText);
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
			cy.get(noticeRegionSelector).should("be.empty");
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
