/**
 * Regression coverage for the `webchat/close-button` analytics event.
 *
 * Background: the header close ("X") button and the toggle button (FAB) both
 * collapse the Webchat and both emit `webchat/close`. Integrations that end the
 * session on `webchat/close` therefore also end it when the user simply toggles
 * the widget shut. The dedicated `webchat/close-button` event fires ONLY for the
 * header close button, so integrations can distinguish an intentional close.
 *
 * These tests assert the event fires for the header X and for nothing else
 * (toggle button, minimize, programmatic open/close/toggle).
 */

type AnalyticsEvent = { type: string; payload?: any };

/** Register a collector that records every analytics event emitted from now on. */
const collectEvents = (events: AnalyticsEvent[]) =>
	cy.getWebchat().then((webchat: any) => {
		webchat.registerAnalyticsService((event: AnalyticsEvent) => events.push(event));
	});

/** Open the Webchat and advance past the home screen into the chat screen. */
const openChatScreen = () => cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

const typesOf = (events: AnalyticsEvent[]) => events.map(event => event.type);

describe("Analytics: webchat/close-button event", () => {
	it("emits 'webchat/close-button' when the header close (X) button is clicked", () => {
		const events: AnalyticsEvent[] = [];
		openChatScreen();
		collectEvents(events);

		cy.get("[data-header-close-button]").click();

		cy.then(() => {
			const closeButtonEvents = events.filter(event => event.type === "webchat/close-button");
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

	it("does NOT emit 'webchat/close-button' from the home screen close button (it minimizes)", () => {
		const events: AnalyticsEvent[] = [];
		// Home screen enabled: opening lands on the home screen (no startConversation).
		cy.visitWebchat().initMockWebchat({ settings: { homeScreen: { enabled: true } } });
		cy.openWebchat();
		collectEvents(events);

		cy.get(".webchat-homescreen-close-button").click();

		cy.wait(200);
		cy.then(() => {
			const types = typesOf(events);
			expect(types, "home screen close emits webchat/minimize").to.include(
				"webchat/minimize",
			);
			expect(types, "home screen close must NOT emit webchat/close-button").to.not.include(
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

describe("Analytics: end-session use case (docs/analytics-api.md example)", () => {
	/**
	 * Mirrors the documented integration: end the session ONLY on the header
	 * close button. Spies on `webchat.endSession` and wires the documented
	 * handler, then asserts which UI interactions trigger it.
	 */
	const wireEndSessionOnCloseButton = () =>
		cy.getWebchat().then((webchat: any) => {
			cy.spy(webchat, "endSession").as("endSession");
			webchat.registerAnalyticsService((event: AnalyticsEvent) => {
				if (event.type === "webchat/close-button") {
					webchat.endSession();
				}
			});
		});

	it("ends the session when the header close (X) button is used", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
		wireEndSessionOnCloseButton();

		cy.get("[data-header-close-button]").click();

		cy.get("@endSession").should("have.been.calledOnce");
	});

	it("does NOT end the session when collapsing via the toggle button", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
		wireEndSessionOnCloseButton();

		cy.get("#webchatWindowToggleButton").click();

		cy.wait(200);
		cy.get("@endSession").should("not.have.been.called");
	});

	it("does NOT end the session when minimizing", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
		wireEndSessionOnCloseButton();

		cy.get("[data-header-minimize-button]").click();

		cy.wait(200);
		cy.get("@endSession").should("not.have.been.called");
	});
});
