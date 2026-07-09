/**
 * Coverage for the `webchat/close-button` analytics event and its payload.
 *
 * The event fires from every header close ("X") button — the chat window
 * header, the home screen, and the connection-lost (disconnect) overlay — and
 * NOT from the toggle button (FAB), the minimize button, or the programmatic
 * open/close/toggle APIs. Both the toggle button and the header X emit the
 * generic `webchat/close`, so integrations that want an intentional-close
 * signal rely on `webchat/close-button` instead.
 *
 * Its payload carries the connection status at close time
 * (`{ connected, hadConnection }`) so integrations can act only when a session
 * was actually active — the close button also appears on screens shown before
 * the first connection (a first-visit home screen, privacy notice,
 * previous-conversations) where `hadConnection` is false. These tests assert
 * the emission rules, the payload values, the documented disconnect-on-close
 * integration, and the `webchat.disconnect()` API it relies on.
 */

type AnalyticsEvent = { type: string; payload?: any };

/** Register a collector that records every analytics event emitted from now on. */
const collectEvents = (events: AnalyticsEvent[]) =>
	cy.getWebchat().then((webchat: any) => {
		webchat.registerAnalyticsService((event: AnalyticsEvent) => events.push(event));
	});

/** Open the Webchat and advance past the home screen into the chat screen. */
const openChatScreen = () => cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

/**
 * The mock endpoint never opens a real socket, so drive the connection state
 * through the store (as the `sendMessage` support command does).
 */
const setConnected = (connected: boolean) =>
	cy.getWebchat().then((webchat: any) => {
		webchat.store.dispatch({ type: "SET_CONNECTED", connected });
	});

/**
 * Connect via the store, then gate (retriably) on the store reflecting it —
 * rather than a fixed wait — so WebchatUI's `hadConnection` latch has committed
 * before we act. `hadConnection` latches true when `connected` first becomes
 * true and never resets.
 */
const connectAndLatch = () => {
	setConnected(true);
	cy.getWebchat().its("store").invoke("getState").its("connection.connected").should("be.true");
};

/**
 * Render the connection-lost overlay by connecting then dropping. react-redux 7
 * on React 18 commits the transient connected state asynchronously, and
 * `hadConnection` (WebchatUI component state) has no observable while connected —
 * so rather than bet on a fixed delay, retry the connect/drop until the overlay
 * (which requires the `hadConnection` latch) actually renders. `hadConnection`
 * latches on any connect and never resets, so this converges.
 */
const showDisconnectOverlayViaDrop = (attempt = 0) => {
	setConnected(true);
	cy.wait(50); // let react-redux 7 commit the connect so hadConnection can latch
	setConnected(false);
	cy.get("body").then($body => {
		const shown = $body.find("[data-disconnect-overlay-close-button]").length > 0;
		if (!shown && attempt < 20) {
			showDisconnectOverlayViaDrop(attempt + 1);
		}
	});
};

const typesOf = (events: AnalyticsEvent[]) => events.map(event => event.type);
const closeButtonEventsOf = (events: AnalyticsEvent[]) =>
	events.filter(event => event.type === "webchat/close-button");

describe("Analytics: webchat/close-button event", () => {
	it("emits 'webchat/close-button' when the header close (X) button is clicked", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.get("[data-header-close-button]").click();

		cy.then(() => {
			const closeButtonEvents = closeButtonEventsOf(events);
			expect(closeButtonEvents, "exactly one webchat/close-button event").to.have.length(1);
		});
	});

	it("still emits the generic 'webchat/close' alongside it (backward compatible)", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.get("[data-header-close-button]").click();

		cy.then(() => {
			const types = typesOf(events);
			expect(types, "header X must still emit webchat/close").to.include("webchat/close");
			expect(types, "header X must also emit webchat/close-button").to.include(
				"webchat/close-button",
			);
		});
	});

	it("does NOT emit 'webchat/close-button' when collapsing via the toggle button", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		// Clicking the FAB while open collapses the chat (the user's reported scenario).
		cy.get("#webchatWindowToggleButton").click();

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "toggle should still emit webchat/close").to.include("webchat/close");
			expect(types, "toggle must NOT emit webchat/close-button").to.not.include(
				"webchat/close-button",
			);
		});
	});

	it("does NOT emit 'webchat/close-button' when minimizing", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.get("[data-header-minimize-button]").click();

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "minimize emits webchat/minimize").to.include("webchat/minimize");
			expect(types, "minimize must NOT emit webchat/close-button").to.not.include(
				"webchat/close-button",
			);
			expect(types, "minimize must NOT emit webchat/close").to.not.include("webchat/close");
		});
	});

	it("emits 'webchat/close-button' from the home screen close button (alongside webchat/minimize)", () => {
		const events: AnalyticsEvent[] = [];
		// Home screen enabled: opening lands on the home screen (no startConversation).
		cy.visitWebchat().initMockWebchat({ settings: { homeScreen: { enabled: true } } });
		cy.openWebchat();
		collectEvents(events);

		cy.get(".webchat-homescreen-close-button").click();

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "home screen close still emits webchat/minimize").to.include(
				"webchat/minimize",
			);
			expect(types, "home screen close now also emits webchat/close-button").to.include(
				"webchat/close-button",
			);
		});
	});

	it("does NOT emit 'webchat/close-button' via the programmatic webchat.close() API", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.getWebchat().then((webchat: any) => webchat.close());

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "webchat.close() emits webchat/close").to.include("webchat/close");
			expect(types, "webchat.close() must NOT emit webchat/close-button").to.not.include(
				"webchat/close-button",
			);
		});
	});

	it("does NOT emit 'webchat/close-button' via the programmatic webchat.toggle() API", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.getWebchat().then((webchat: any) => webchat.toggle()); // open -> closed

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "toggle() emits webchat/close").to.include("webchat/close");
			expect(types, "toggle() must NOT emit webchat/close-button").to.not.include(
				"webchat/close-button",
			);
		});
	});

	it("does NOT emit 'webchat/close-button' when opening", () => {
		const events: AnalyticsEvent[] = [];
		cy.visitWebchat().initMockWebchat();
		collectEvents(events);

		cy.openWebchat().startConversation();

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "opening emits webchat/open").to.include("webchat/open");
			expect(types, "opening must NOT emit webchat/close-button").to.not.include(
				"webchat/close-button",
			);
		});
	});
});

describe("Analytics: webchat/close-button payload (connection status)", () => {
	it("reports { connected: false, hadConnection: false } on a screen that never connected", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen(); // the mock never establishes a connection
		collectEvents(events);

		cy.get("[data-header-close-button]").click();

		cy.then(() => {
			const [event] = closeButtonEventsOf(events);
			expect(event?.payload).to.deep.equal({ connected: false, hadConnection: false });
		});
	});

	it("reports { connected: true, hadConnection: true } while connected", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		connectAndLatch();
		collectEvents(events);

		cy.get("[data-header-close-button]").click();

		cy.then(() => {
			const [event] = closeButtonEventsOf(events);
			expect(event?.payload).to.deep.equal({ connected: true, hadConnection: true });
		});
	});

	it("reports { connected: false, hadConnection: true } from the disconnect overlay after the connection drops", () => {
		const events: AnalyticsEvent[] = [];
		cy.visitWebchat().initMockWebchat({
			settings: { behavior: { enableConnectionStatusIndicator: true } },
		});
		cy.openWebchat().startConversation();
		collectEvents(events);

		// With the connection-status indicator on, a previously connected session
		// that disconnects renders the connection-lost overlay. Reaching it proves
		// hadConnection latched true while connected is now false.
		showDisconnectOverlayViaDrop();
		cy.get("[data-disconnect-overlay-close-button]").should("be.visible").click();

		cy.then(() => {
			const [event] = closeButtonEventsOf(events);
			expect(event?.payload).to.deep.equal({ connected: false, hadConnection: true });
		});
	});
});

describe("Analytics: disconnect-on-close use case (docs/analytics-api.md example)", () => {
	/**
	 * Mirrors the documented integration: disconnect on the header close button,
	 * but ONLY when a session was actually active (`event.payload.hadConnection`).
	 * Spies on `webchat.disconnect`, wires the documented handler, then asserts
	 * which interactions trigger it.
	 */
	const wireDisconnectOnCloseButton = () =>
		cy.getWebchat().then((webchat: any) => {
			cy.spy(webchat, "disconnect").as("disconnect");
			webchat.registerAnalyticsService((event: AnalyticsEvent) => {
				if (event.type === "webchat/close-button" && event.payload?.hadConnection) {
					webchat.disconnect();
				}
			});
		});

	it("disconnects when the header close (X) button is used on a connected session", () => {
		openChatScreen();
		connectAndLatch();
		wireDisconnectOnCloseButton();

		cy.get("[data-header-close-button]").click();

		cy.get("@disconnect").should("have.been.calledOnce");
	});

	it("does NOT disconnect when closing the home screen before any connection (event still fires)", () => {
		const events: AnalyticsEvent[] = [];
		// Home screen X emits webchat/close-button, but hadConnection is false with
		// no prior connection, so the documented guard leaves it alone. Assert the
		// event DID fire, so it is the guard — not a missing event — that suppresses
		// the disconnect.
		cy.visitWebchat().initMockWebchat({ settings: { homeScreen: { enabled: true } } });
		cy.openWebchat();
		collectEvents(events);
		wireDisconnectOnCloseButton();

		cy.get(".webchat-homescreen-close-button").click();

		cy.wait(200);
		cy.then(() => {
			const [event] = closeButtonEventsOf(events);
			expect(event, "close-button fired on the home screen").to.exist;
			expect(event.payload).to.deep.equal({ connected: false, hadConnection: false });
		});
		cy.get("@disconnect").should("not.have.been.called");
	});

	it("DOES disconnect when closing the home screen after a prior connection", () => {
		// hadConnection latches true on first connect and never resets, and the home
		// screen is reachable again after connecting (the header X sets showHomeScreen
		// true, then reopening lands back on it). A home-screen close there carries
		// hadConnection: true, so the documented guard fires.
		cy.visitWebchat().initMockWebchat({ settings: { homeScreen: { enabled: true } } });
		cy.openWebchat().startConversation(); // leave the home screen into the chat
		connectAndLatch(); // connect -> hadConnection latches true
		cy.get("[data-header-close-button]").click(); // header X: returns to home screen + collapses
		cy.openWebchat(); // reopen -> back on the home screen, still connected
		wireDisconnectOnCloseButton();

		cy.get(".webchat-homescreen-close-button").should("be.visible").click();

		cy.get("@disconnect").should("have.been.calledOnce");
	});

	it("does NOT disconnect when collapsing via the toggle button", () => {
		openChatScreen();
		connectAndLatch();
		wireDisconnectOnCloseButton();

		cy.get("#webchatWindowToggleButton").click();

		cy.wait(200);
		cy.get("@disconnect").should("not.have.been.called");
	});

	it("does NOT disconnect when minimizing", () => {
		openChatScreen();
		connectAndLatch();
		wireDisconnectOnCloseButton();

		cy.get("[data-header-minimize-button]").click();

		cy.wait(200);
		cy.get("@disconnect").should("not.have.been.called");
	});
});

describe("Webchat API: disconnect()", () => {
	it("tears down the socket connection through the client", () => {
		openChatScreen();

		cy.getWebchat().then((webchat: any) => {
			// webchat.disconnect() dispatches DISCONNECT, which the connection
			// middleware forwards to the socket client.
			const clientDisconnect = cy.spy(webchat.client, "disconnect");
			webchat.disconnect();
			expect(clientDisconnect, "client.disconnect called once").to.have.been.calledOnce;
		});
	});
});
