describe("Screen Reader Live Region", () => {
	const liveRegionSelector = "#webchatMessageContainerScreenReaderLiveRegion";
	// initMockWebchat's default endpoint origin is a REAL, reachable host:
	// only the config GET is stubbed, so the socket dials out for real and
	// its first connect can hang until socket.io's own ~20s timeout. The
	// AI-agent notice waits for that first connect to settle (and message
	// announcements queue behind the notice), so every announcement in this
	// spec would inherit that wait. An unroutable origin fails the connect
	// in milliseconds, which is both hermetic and fast — no test here needs
	// a live socket, messages are injected through `_handleOutput`.
	const unconnectableEndpoint = "http://mock-endpoint.invalid/asdfqwer";

	beforeEach(() => {
		cy.visitWebchat();
		cy.initMockWebchat(undefined, undefined, unconnectableEndpoint);
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

		// The notice is held until the page load's FIRST connect has
		// settled — that connect is what assigns the session id and
		// restores a persisted conversation, so before it settles Webchat
		// cannot tell a brand-new conversation from a continued one. Both
		// the "announces" and the "stays silent" assertions below therefore
		// start from this point rather than from a fixed wait: on CI a
		// connect to a real endpoint regularly outlasts the intro's 600ms
		// delay.
		const waitForFirstConnectSettled = () =>
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => {
						const { connection, options } = webchat.store.getState();
						return !connection.connecting || !!options.sessionId;
					}),
				{ timeout: 20000, interval: 100 },
			);

		// Keeps the page load's FIRST connect in flight for the rest of the
		// test. A real stall cannot be arranged from Cypress — the socket
		// dials an unroutable origin and settles on its own schedule, and
		// `cy.intercept` cannot hold socket.io's transport open — so the
		// flag is driven through the store instead: let the one real
		// attempt settle (socket.io reconnection is off and a retry only
		// follows a NETWORK_ON / SET_PAGE_VISIBLE / SEND_MESSAGE, none of
		// which these tests trigger), then re-arm `connecting`. Callers
		// install `cy.clock` first, so no app timer has fired in between
		// and the intro sees one uninterrupted pending connect.
		const holdFirstConnectInFlight = () => {
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
		};

		// The connect resolves, in connection-middleware's order:
		// `setOptions` first — `options-middleware` restores a persisted
		// conversation while handling it — and `connecting` released last,
		// so the restore is already in the store when the hold lifts.
		const settleFirstConnect = (options: Record<string, string>) => {
			cy.getWebchat().then(webchat => {
				webchat.store.dispatch({ type: "SET_OPTIONS", options });
				webchat.store.dispatch({ type: "SET_CONNECTING", connecting: false });
			});
			// Real time first: the released hold has to reach the live
			// region (and re-arm the 600ms timer) before fake time passes.
			cy.wait(100);
		};

		it("announces the default notice when the chat screen appears", () => {
			// beforeEach already opened the chat screen; the notice follows
			// the first connect settling, then its 600ms intro delay.
			waitForFirstConnectSettled();
			cy.wait(800);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
		});

		it("announces the configured AIAgentNoticeText", () => {
			cy.visitWebchat();
			cy.initMockWebchat(
				{
					settings: {
						behavior: {
							AIAgentNoticeText: "Je chat met een digitale AI assistent",
						},
					},
				},
				undefined,
				unconnectableEndpoint,
			);
			cy.openWebchat().startConversation();

			waitForFirstConnectSettled();
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
			cy.initMockWebchat(undefined, undefined, unconnectableEndpoint);
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
			waitForFirstConnectSettled();
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
			waitForFirstConnectSettled();
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
			waitForFirstConnectSettled();
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
				unconnectableEndpoint,
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

			holdFirstConnectInFlight();

			// The precondition the assertion below rests on: nothing has
			// settled the connect behind our back.
			cy.getWebchat().then(webchat => {
				expect(webchat.store.getState().connection.connecting).to.equal(true);
			});

			// Well past the intro deadline — still nothing, the notice waits
			// for the connect. `cy.wait` runs on real time (only the app's
			// timers are faked) and lets an announcement's own commit land,
			// so an empty region here really means "not announced".
			cy.tick(1000);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("be.empty");

			settleFirstConnect({ userId, sessionId, channel: "channel-1" });
			cy.contains('You said "hello".').should("be.visible");

			// A continued conversation: silent from here on, too.
			cy.tick(1000);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("not.contain.text", noticeText);
		});

		it("announces the notice when the first connect fails", () => {
			// The hold must not swallow the notice when there is nothing to
			// wait for any more: a connect that fails settles the same as one
			// that succeeds, and the notice describes the chat, not the
			// connection. A pinned `sessionId` — the shape a persisted
			// conversation has, so the hold is definitely armed — plus an
			// unroutable origin, so the connect can only ever fail. The
			// notice is asserted with a retry rather than after a fixed
			// wait because Webchat retries a failed first connect
			// (CGY-3852) and each attempt re-arms the hold; the notice
			// lands in the first window that outlasts the 600ms delay.
			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.visitWebchat();
			cy.initMockWebchat(
				{
					userId: "user-cgy3519-failed-connect",
					sessionId: "session-cgy3519-failed-connect",
					channel: "channel-1",
				},
				undefined,
				unconnectableEndpoint,
			);
			cy.openWebchat().startConversation();

			// No session id was ever assigned, so this settles as a failure.
			waitForFirstConnectSettled();
			cy.getWebchat().then(webchat => {
				expect(webchat.store.getState().options.sessionId || "").to.equal("");
			});
			cy.get(noticeRegionSelector, { timeout: 10000 }).should("contain.text", noticeText);
		});

		it("still announces the notice before a message that arrives while the first connect is in flight", () => {
			// The hold defers the notice's timer but keeps the intro
			// PENDING, so message announcements queue behind it. Were the
			// intro withheld instead, a message present before the connect
			// settles — an engagement teaser, a message typed while
			// connecting — would be announced first and the notice would
			// follow it, inverting the intro-first order.
			const sessionId = "session-cgy3519-order-under-hold";

			cy.visitWebchat();
			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.initMockWebchat(
				{ userId: "user-cgy3519-order-under-hold", channel: "channel-1" },
				undefined,
				unconnectableEndpoint,
			);
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => webchat.store.getState().config.isConfigLoaded),
				{ timeout: 10000, interval: 50 },
			);
			cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
			cy.openWebchat().startConversation();

			holdFirstConnectInFlight();

			cy.receiveMessage("Hello there");

			// Run the message's own pipeline to completion: `messageDelay`
			// (500ms) before it reaches the store, then the live region's
			// 100ms announce debounce. The ticks are interleaved with real
			// time so React can commit in between — one coarse tick would
			// arm the debounce only after the tick had already ended, and
			// the region would then read as empty whether or not the hold
			// works.
			cy.tick(500);
			cy.wait(100);
			// On screen, so an empty message region below means "not
			// announced", not "not rendered yet".
			cy.contains("Hello there").should("be.visible");
			cy.tick(200);
			cy.wait(100);
			cy.get(liveRegionSelector).should("be.empty");

			// Past the intro's 600ms delay as well: neither has been
			// announced, the message is queued behind the pending intro
			// (and the connect is still in flight, so the hold is real).
			cy.getWebchat().then(webchat => {
				expect(webchat.store.getState().connection.connecting).to.equal(true);
			});
			cy.tick(1000);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("be.empty");
			cy.get(liveRegionSelector).should("be.empty");

			// The connect resolves into a brand-new session: notice first…
			settleFirstConnect({
				userId: "user-cgy3519-order-under-hold",
				sessionId,
				channel: "channel-1",
			});
			cy.tick(600);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
			cy.get(liveRegionSelector).should("be.empty");

			// …then the held message, after its own 100ms debounce.
			cy.tick(100);
			cy.wait(100);
			cy.get(liveRegionSelector).should("contain.text", "Hello there");
		});

		it("gives up the hold when the first connect never settles", () => {
			// Safety valve: a socket that connects but never completes its
			// handshake would keep `connecting` true forever, and a held
			// intro also holds every message announcement. After
			// INTRO_HOLD_TIMEOUT_MS the notice is announced anyway and the
			// message region is released with it — one notice too many
			// beats a live region that never speaks again.
			cy.visitWebchat();
			cy.window().then(window => {
				window.localStorage.clear();
			});
			cy.initMockWebchat(
				{ userId: "user-cgy3519-hold-timeout", channel: "channel-1" },
				undefined,
				unconnectableEndpoint,
			);
			cy.waitUntil(
				() =>
					cy.getWebchat().then(webchat => webchat.store.getState().config.isConfigLoaded),
				{ timeout: 10000, interval: 50 },
			);
			cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
			cy.openWebchat().startConversation();

			holdFirstConnectInFlight();
			cy.receiveMessage("Hello there");
			cy.tick(700);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("be.empty");
			cy.get(liveRegionSelector).should("be.empty");

			// Past INTRO_HOLD_TIMEOUT_MS (8000ms) while the connect is
			// still in flight: the notice fires, then the queued message.
			cy.getWebchat().then(webchat => {
				expect(webchat.store.getState().connection.connecting).to.equal(true);
			});
			cy.tick(7500);
			cy.wait(100);
			cy.get(noticeRegionSelector).should("contain.text", noticeText);
			cy.tick(100);
			cy.wait(100);
			cy.get(liveRegionSelector).should("contain.text", "Hello there");
		});

		it("does not announce anything when the notice is disabled", () => {
			cy.visitWebchat();
			cy.initMockWebchat(
				{
					settings: {
						behavior: {
							enableAIAgentNotice: false,
						},
					},
				},
				undefined,
				unconnectableEndpoint,
			);
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
