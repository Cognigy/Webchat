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

		// An embedding with a pinned `sessionId` holds the notice until the
		// page load's FIRST connect has settled — that connect is what
		// assigns the session id and restores the persisted conversation, so
		// before it settles Webchat cannot tell a brand-new conversation
		// from a continued one. Assertions in those tests start from this
		// point rather than from a fixed wait: on CI the connect to a real
		// endpoint regularly takes longer than the intro's 600ms delay.
		const waitForFirstConnectSettled = () =>
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => {
						const { connection, options } = webchat.store.getState();
						return !connection.connecting || !!options.sessionId;
					}),
				{ timeout: 20000, interval: 100 },
			);

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
			// Rebuild the webchat with a frozen clock: the intro's 600ms timer
			// starts when the chat screen mounts (inside startConversation),
			// so the clock must be installed before that — freezing it in the
			// test body after beforeEach would leave the timer on real time,
			// racing command overhead against the 600ms deadline (flaky on
			// slow CI runners). Only setTimeout/clearTimeout are faked so
			// Date.now-based code (e.g. toasts) keeps working.
			// Use an unroutable endpoint origin so the socket can NEVER
			// connect. The default endpoint-mock.cognigy.ai is a real,
			// reachable host: in CI the socket connects and then flaps
			// (connect → server drop → reconnect), which briefly opens the
			// disconnect overlay — and an open overlay withdraws the intro,
			// CANCELLING its pending 600ms timer; the re-schedule after the
			// flap starts a fresh 600ms countdown at the CURRENT fake time,
			// pushing the deadline past this test's tick budget so the intro
			// never commits. With no connectable socket there is exactly one
			// failed connect attempt (socket.io reconnection is off) and the
			// timer keeps its original fake-time-0 deadline.
			cy.visitWebchat();
			cy.initMockWebchat(undefined, undefined, "http://mock-endpoint.invalid/asdfqwer");
			cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
			cy.openWebchat().startConversation();

			// Belt and braces: wait for that one connect attempt to settle
			// (it fails in milliseconds) so its state updates can't land
			// between ticks.
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => {
						const state = webchat.store.getState();
						return !state.connection.connecting;
					}),
				{ timeout: 10000, interval: 100 },
			);

			// The message lands well inside the intro's 600ms deferral — it
			// must be announced AFTER the intro, not instead of it.
			cy.receiveMessage("Hello there");

			// Just before the intro deadline nothing is committed: the
			// message announcement is held while the intro is pending.
			cy.tick(599);
			cy.get(noticeRegionSelector).should("be.empty");
			cy.get(liveRegionSelector).should("be.empty");

			// The intro commits at 600ms — the message region is still empty…
			cy.tick(1);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
			cy.get(liveRegionSelector).should("be.empty");

			// …and the held message follows after its own 100ms debounce.
			cy.tick(100);
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
			// NOTE: the region remounts empty on navigation, so this
			// assertion's baseline is the unmount wiping the FIRST
			// announcement — what it actually tests is that no NEW
			// announcement was committed during the 800ms (past the 600ms
			// intro delay). If the region ever stays mounted across
			// navigation, revisit this assertion.
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
			// NOTE: the region remounted empty on navigation (the earlier
			// announcement is gone with the unmount); this asserts no NEW
			// announcement after the reopen. The window starts once the
			// session switch has reconnected (which closes the reconnect
			// overlay, until then the intro is withheld) rather than after a
			// fixed wait, so a slow switch cannot make the silence spurious.
			cy.get(".webchat-prev-conversations-item").eq(0).click();
			cy.contains('You said "hello".').should("be.visible");
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => {
						const { connected, connecting } = webchat.store.getState().connection;
						return connected && !connecting;
					}),
				{ timeout: 20000, interval: 100 },
			);
			cy.wait(800);
			cy.get(noticeRegionSelector).should("not.contain.text", noticeText);
		});

		it("stays silent when a persisted conversation is restored after a page reload", () => {
			const options = {
				userId: "user-cgy3519-reload",
				sessionId: "session-cgy3519-reload",
				channel: "channel-1",
			};

			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.visitWebchat();
			cy.initWebchat(options);
			cy.openWebchat().startConversation();
			cy.get(noticeRegionSelector).should("contain.text", noticeText);

			// Persist some history for this session.
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			// "Reload" the page: revisit and re-init with the same user and
			// session — the conversation is restored from storage in the same
			// React commit as the first connect's session id. A restored
			// conversation is a continuation, not a brand-new one: no notice.
			cy.visitWebchat();
			cy.initWebchat(options);
			cy.openWebchat().startConversation();

			// Anchor the silence window to the restore instead of guessing a
			// duration: once the first connect has settled AND the persisted
			// history is on screen, the notice's decision has been made, so
			// waiting past the 600ms intro delay from here is conclusive.
			waitForFirstConnectSettled();
			cy.contains('You said "hello".').should("be.visible");
			cy.wait(800);
			cy.get(noticeRegionSelector).should("not.contain.text", noticeText);
		});

		it("stays silent when a slow first connect restores a persisted conversation", () => {
			// The reload test above depends on a real endpoint, which decides
			// whether the connect wins the race against the intro's 600ms
			// delay. This one removes the race: the socket can never connect
			// (unroutable origin) and the clock is frozen, so the first
			// connect is driven through the store — in flight past the intro
			// deadline, then resolving with the session id and the persisted
			// restore together, exactly as connection-middleware does it.
			// Without the hold this announces the notice for a conversation
			// the user is merely continuing.
			const userId = "user-cgy3519-slow-connect";
			const sessionId = "session-cgy3519-slow-connect";
			// URLToken comes from initMockWebchat's stubbed endpoint response.
			const storageKey = JSON.stringify([
				"webchat-client",
				userId,
				sessionId,
				"fake-url-token",
			]);
			const persistedConversation = {
				messages: [
					{ text: "hello", source: "user", id: "reload-1", timestamp: 1700000000000 },
					{
						text: 'You said "hello".',
						data: {},
						source: "bot",
						id: "reload-2",
						timestamp: 1700000000001,
					},
				],
				rating: { hasGivenRating: false, showRatingScreen: false },
			};

			cy.visitWebchat();
			cy.window().then(window => {
				window.localStorage.clear();
				window.localStorage.setItem(storageKey, JSON.stringify(persistedConversation));
			});
			cy.initMockWebchat(
				{ userId, sessionId, channel: "channel-1" },
				undefined,
				"http://mock-endpoint.invalid/asdfqwer",
			);
			// The endpoint config carries the URLToken the storage key is
			// built from, so the restore can only happen once it is loaded —
			// and `open()` polls for it with a setTimeout that the frozen
			// clock would never advance.
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => webchat.store.getState().config.isConfigLoaded),
				{ timeout: 10000, interval: 50 },
			);
			cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
			cy.openWebchat().startConversation();

			// Let the one real (failing) connect attempt settle, then model a
			// first connect that is still in flight. No fake time passes in
			// between, so the intro sees an uninterrupted pending connect.
			cy.waitUntil(
				() =>
					cy
						.getWebchat()
						.then(webchat => !webchat.store.getState().connection.connecting),
				{ timeout: 10000, interval: 100 },
			);
			cy.getWebchat().then(webchat => {
				webchat.store.dispatch({ type: "SET_CONNECTING", connecting: true });
			});
			// Real time, so React commits that state before any fake time
			// advances — cy.tick would otherwise fire the app's timers while
			// the update is still queued.
			cy.wait(100);

			// Well past the intro deadline — still nothing, the notice waits
			// for the connect. `cy.wait` runs on real time (only the app's
			// timers are faked) and lets the announcement's own commit land,
			// so an empty region here really means "not announced".
			cy.tick(1000);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("be.empty");

			// The connect resolves: session id and restored history land in
			// one commit, as they do in connection-middleware.
			cy.getWebchat().then(webchat => {
				webchat.store.dispatch({ type: "SET_CONNECTING", connecting: false });
				webchat.store.dispatch({
					type: "SET_OPTIONS",
					options: { userId, sessionId, channel: "channel-1" },
				});
			});
			cy.contains('You said "hello".').should("be.visible");

			// A continued conversation: silent from here on, too.
			cy.tick(1000);
			cy.wait(100);
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

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat screen with live regions has no detectable a11y violations", () => {
			// beforeEach opened the chat screen; wait for the notice to be
			// committed so axe sees the populated (sr-only) live regions too.
			cy.receiveMessage("Hello there");
			cy.get("#webchatAIAgentNoticeLiveRegion").should("not.be.empty");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
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
