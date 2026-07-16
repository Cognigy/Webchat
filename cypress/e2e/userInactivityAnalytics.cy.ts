/**
 * Coverage for the `webchat/user-inactive` analytics event, opt-in via
 * `settings.widgetSettings.userInactivity` (docs/analytics-api.md).
 *
 * The event fires when the webchat is connected and the user has not been
 * active — no outgoing message, no typing — for the configured timeout.
 * It fires once per inactivity period (new user activity arms it again),
 * never fires while disconnected, and does NOT treat the documented
 * analytics-forwarding message (`webchat.sendMessage("", { analyticsEvent })`)
 * as user activity — otherwise that integration would re-arm the timer and
 * loop forever on an abandoned chat.
 *
 * Waits use generous margins around short timeouts to stay robust on slow
 * CI runners: assertions of "not fired yet" happen at half the timeout,
 * assertions of "fired" a full timeout after it elapsed.
 */

type AnalyticsEvent = { type: string; payload?: any };

const USER_INACTIVE = "webchat/user-inactive";

/** Register a collector that records every analytics event emitted from now on. */
const collectEvents = (events: AnalyticsEvent[]) =>
	cy.getWebchat().then((webchat: any) => {
		webchat.registerAnalyticsService((event: AnalyticsEvent) => events.push(event));
	});

/** Open the chat screen with inactivity detection configured. */
const openWithInactivity = (userInactivity: { enabled: boolean; timeout: number }) =>
	cy
		.visitWebchat()
		.initMockWebchat({ settings: { widgetSettings: { userInactivity } } })
		.openWebchat()
		.startConversation();

/**
 * The mock endpoint never opens a real socket, so drive the connection state
 * through the store (as the `sendMessage` support command does).
 */
const setConnected = (connected: boolean) =>
	cy.getWebchat().then((webchat: any) => {
		webchat.store.dispatch({ type: "SET_CONNECTED", connected });
	});

const inactiveEventsOf = (events: AnalyticsEvent[]) =>
	events.filter(event => event.type === USER_INACTIVE);

describe("Analytics: webchat/user-inactive event", () => {
	it("emits 'webchat/user-inactive' once the user has been inactive for the configured timeout", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 1000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(2000);
		cy.then(() => {
			const inactiveEvents = inactiveEventsOf(events);
			expect(inactiveEvents, "exactly one webchat/user-inactive event").to.have.length(1);
			expect(inactiveEvents[0].payload.timeout).to.equal(1000);
			expect(
				new Date(inactiveEvents[0].payload.inactiveSince).getTime(),
				"inactiveSince is a valid ISO timestamp",
			).to.not.be.NaN;
		});
	});

	it("does NOT emit when the detection is not enabled", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: false, timeout: 1000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(2000);
		cy.then(() => {
			expect(inactiveEventsOf(events), "disabled detection never fires").to.have.length(0);
		});
	});

	it("does NOT emit while no connection was established", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 1000 });
		collectEvents(events);
		// no setConnected — the mock endpoint never connects on its own

		cy.wait(2000);
		cy.then(() => {
			expect(inactiveEventsOf(events), "no event without a connection").to.have.length(0);
		});
	});

	it("cancels the detection when the connection drops", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 1000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(500); // half the timeout — nothing fired yet
		setConnected(false);

		cy.wait(2000);
		cy.then(() => {
			expect(inactiveEventsOf(events), "disconnect cancels the timer").to.have.length(0);
		});
	});

	it("is reset by an outgoing user message", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 2000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(1000); // half the timeout
		cy.sendMessage("still here"); // user activity re-arms the timer

		cy.wait(1000); // 2000ms since connect, but only 1000ms since the message
		cy.then(() => {
			expect(inactiveEventsOf(events), "not fired yet — the message reset it").to.have.length(
				0,
			);
		});

		cy.wait(3000); // now well past the timeout since the message
		cy.then(() => {
			expect(inactiveEventsOf(events), "fires timed from the last message").to.have.length(1);
		});
	});

	it("is reset by the user typing in the input", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 2000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(1000); // half the timeout
		cy.get(".webchat-input-message-input").type("typing but not sending");

		cy.wait(1000); // 2000ms since connect, but only 1000ms since typing
		cy.then(() => {
			expect(inactiveEventsOf(events), "not fired yet — typing reset it").to.have.length(0);
		});

		cy.wait(3000); // now well past the timeout since typing stopped
		cy.then(() => {
			expect(inactiveEventsOf(events), "fires timed from the last typing").to.have.length(1);
		});
	});

	it("fires once per inactivity period, then re-arms on new user activity", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 1000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(3000); // three timeouts of continued silence
		cy.then(() => {
			expect(inactiveEventsOf(events), "continued silence fires only once").to.have.length(1);
		});

		cy.sendMessage("back again"); // user activity arms the detection again

		cy.wait(2000);
		cy.then(() => {
			expect(inactiveEventsOf(events), "a second period fires a second event").to.have.length(
				2,
			);
		});
	});
});

describe("Analytics: forwarding use case (docs/analytics-api.md example)", () => {
	/**
	 * Mirrors the documented integration: forward the event to the flow as a
	 * data-only message. That message must not count as user activity, so the
	 * event fires exactly once per inactivity period instead of looping.
	 */
	const wireForwardingHandler = () =>
		cy.getWebchat().then((webchat: any) => {
			webchat.registerAnalyticsService((event: AnalyticsEvent) => {
				if (event.type === USER_INACTIVE) {
					webchat.sendMessage("", {
						analyticsEvent: event.type,
						payload: event.payload,
					});
				}
			});
		});

	it("forwards the event as a message without re-arming the timer (no endless loop)", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 1000 });
		collectEvents(events);
		wireForwardingHandler();
		setConnected(true);

		cy.wait(4000); // four timeouts — a re-armed timer would have fired again
		cy.then(() => {
			expect(inactiveEventsOf(events), "the forward must not re-trigger").to.have.length(1);

			const forwards = events.filter(
				event =>
					event.type === "webchat/outgoing-message" &&
					event.payload?.data?.analyticsEvent === USER_INACTIVE,
			);
			expect(forwards, "the event was forwarded as an outgoing message").to.have.length(1);
			expect(forwards[0].payload.text).to.equal("");
		});
	});

	it("still counts a data-only message WITHOUT analyticsEvent as user activity", () => {
		const events: AnalyticsEvent[] = [];
		openWithInactivity({ enabled: true, timeout: 2000 });
		collectEvents(events);
		setConnected(true);

		cy.wait(1000); // half the timeout
		cy.sendMessage("", { somePostback: true }); // e.g. a button postback

		cy.wait(1000); // 2000ms since connect, but only 1000ms since the postback
		cy.then(() => {
			expect(
				inactiveEventsOf(events),
				"a regular data-only message resets the timer",
			).to.have.length(0);
		});
	});
});
