import * as moment from "moment";

/**
 * Input collation (`layout.enableInputCollation`) joins messages typed within
 * `inputCollationTimeout` into one input for the flow.
 *
 * Each typed message is shown as its own bubble right away. Only the socket send
 * waits for the timeout. Until CGY-48210 the bubble waited too, so users saw
 * nothing for a second after pressing Enter. Bubbles are checked in the DOM, and
 * what the flow receives by stubbing `client.sendMessage`.
 */

// The parts of the Webchat instance these tests use.
type AnalyticsEvent = { type: string; payload?: any };
type WebchatHandle = {
	client: { sendMessage: (text: string, data: object | null) => void };
	registerAnalyticsService: (handler: (event: AnalyticsEvent) => void) => void;
};

const collationSettings = (layout: object = {}) => ({
	settings: {
		layout: {
			enableInputCollation: true,
			...layout,
		},
	},
});

// Replaces the socket send, so the test can read what the flow receives.
const stubSendMessage = () =>
	cy.getWebchat().then(webchat => {
		cy.stub((webchat as unknown as WebchatHandle).client, "sendMessage").as("sendMessage");
	});

const typeAndSend = (text: string) =>
	cy
		.get(".webchat-input-message-input")
		.type(text, { delay: 40, parseSpecialCharSequences: false })
		.type("{enter}");

const expectUserBubbles = (texts: string[]) =>
	cy.get(".webchat-message-row.user .chat-bubble").should($bubbles => {
		expect($bubbles.toArray().map(bubble => bubble.textContent?.trim())).to.deep.equal(texts);
	});

const expectSentTexts = (texts: string[]) =>
	cy.get("@sendMessage").should(sendMessage => {
		const calls = (sendMessage as unknown as sinon.SinonStub).getCalls();
		expect(calls.map(call => call.args[0])).to.deep.equal(texts);
	});

describe("collated text inputs", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("shouldn't collate messages by default", () => {
		cy.initMockWebchat().openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("hi");
		typeAndSend("whats up");

		expectUserBubbles(["hi", "whats up"]);
		expectSentTexts(["hi", "whats up"]);
	});

	it("shows each message right away and sends them as one input", () => {
		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("hi");
		typeAndSend("whats up");

		expectUserBubbles(["hi", "whats up"]);
		cy.get("@sendMessage").should("have.been.calledOnceWith", "hi whats up", null);
		// the collated input gets no bubble of its own
		expectUserBubbles(["hi", "whats up"]);
	});

	it("shows the message before the collation timeout ends", () => {
		// Far above the command timeout: a bubble that waits for the send fails this test.
		cy.initMockWebchat(collationSettings({ inputCollationTimeout: 60000 }))
			.openWebchat()
			.startConversation();
		stubSendMessage();

		typeAndSend("hi");

		expectUserBubbles(["hi"]);
		cy.get("@sendMessage").should("not.have.been.called");
	});

	it("sends separate messages if the collate timeout of 1000ms was exceeded", () => {
		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("hi");
		cy.get("@sendMessage").should("have.been.calledOnceWith", "hi", null);
		typeAndSend("whats up");

		expectUserBubbles(["hi", "whats up"]);
		expectSentTexts(["hi", "whats up"]);
	});

	it("collates a messages if the custom collate timeout of 1500ms was not exceeded", () => {
		cy.initMockWebchat(collationSettings({ inputCollationTimeout: 1500 }))
			.openWebchat()
			.startConversation();
		stubSendMessage();

		typeAndSend("hi");
		cy.wait(500);
		typeAndSend("whats up");

		expectUserBubbles(["hi", "whats up"]);
		expectSentTexts(["hi whats up"]);
	});

	it("flushes collated messages when a data-input is sent", () => {
		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("hi");
		typeAndSend("ho");
		cy.sendMessage("", { containsData: true });
		typeAndSend("whats up");

		expectSentTexts(["hi ho", "", "whats up"]);
		cy.get("@sendMessage")
			.its("secondCall.args.1")
			.should("deep.equal", { containsData: true });
		// the flushed messages are already on screen and are not shown again
		cy.get(".webchat-message-row.user .chat-bubble").should("not.contain", "hi ho");
		cy.contains(".webchat-message-row.user", "whats up").should("be.visible");
	});

	it("applies disableHtmlInput to the bubbles and to the collated input", () => {
		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("<b>hi</b> & co");
		typeAndSend("x");

		expectUserBubbles(["hi & co", "x"]);
		expectSentTexts(["hi & co x"]);
	});

	it("emits an outgoing-message event per typed message and one for the collated input", () => {
		const events: AnalyticsEvent[] = [];

		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();
		cy.getWebchat().then(webchat => {
			(webchat as unknown as WebchatHandle).registerAnalyticsService(event =>
				events.push(event),
			);
		});

		typeAndSend("hi");
		typeAndSend("whats up");
		cy.get("@sendMessage").should("have.been.calledOnce");

		cy.then(() => {
			const outgoing = events
				.filter(event => event.type === "webchat/outgoing-message")
				.map(event => event.payload?.text);
			expect(outgoing).to.deep.equal(["hi", "whats up", "hi whats up"]);
		});
	});

	it("restores one bubble per typed message from the persistent history", () => {
		const socketOptions = {
			userId: "collation-user",
			sessionId: "collation-session",
			channel: "collation-channel",
		};
		// Same key layout as getOptionsKey; the URLToken is the mocked endpoint's.
		const storageKey = JSON.stringify([
			"webchat-client",
			socketOptions.userId,
			socketOptions.sessionId,
			"fake-url-token",
		]);
		// An unroutable endpoint keeps the socket closed, so the test sets the
		// session options a connect would set.
		const init = () => {
			cy.initMockWebchat(
				{ ...socketOptions, ...collationSettings() },
				undefined,
				"http://mock-endpoint.invalid/asdfqwer",
			)
				.openWebchat()
				.startConversation();
			cy.getWebchat().then(webchat => {
				webchat.store.dispatch({ type: "SET_OPTIONS", options: socketOptions });
			});
		};

		cy.window().then(window => window.localStorage.clear());
		init();
		stubSendMessage();

		typeAndSend("hi");
		typeAndSend("whats up");
		cy.get("@sendMessage").should("have.been.calledOnceWith", "hi whats up", null);

		cy.window().then(window => {
			const persisted = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
			const userTexts = (persisted.messages ?? [])
				.filter((message: { source: string }) => message.source === "user")
				.map((message: { text: string }) => message.text);
			expect(userTexts).to.deep.equal(["hi", "whats up"]);
		});

		cy.reload();
		init();

		expectUserBubbles(["hi", "whats up"]);
	});

	it("sends a pending typed message before a message from the API, without showing it twice", () => {
		cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		stubSendMessage();

		typeAndSend("hi");
		cy.getWebchat().then(webchat => webchat.sendMessage("from the page"));

		expectSentTexts(["hi", "from the page"]);
		expectUserBubbles(["hi", "from the page"]);
	});

	describe("Template Actions", () => {
		beforeEach(() => {
			cy.initMockWebchat(collationSettings()).openWebchat().startConversation();
		});

		// TODO: make "collate" an opt-in on the "send message" api as an option and only use it on regular text inputs
		it("should verify quick reply behavior in enabled and disabled states", () => {
			// First run - check clickable state
			cy.withMessageFixture("quick-replies", () => {
				cy.get("button:contains('foobar003qr01')").last().should("not.be.disabled");
				cy.get("button:contains('foobar003qr01')").last().click();
				cy.get(".webchat-message-row.user", { timeout: 1000 }).contains("foobar003qr01");
			});

			// Second run - verify disabled state
			cy.withMessageFixture("quick-replies", () => {
				cy.get("button:contains('foobar003qr01')").last().should("be.disabled");
			});
		});
		it("immediately sends a message triggered by a button template button", () => {
			cy.withMessageFixture("buttons", () => {
				cy.contains("foobar005b1").focus();
				cy.contains("foobar005b1").click();
				cy.get(".webchat-message-row.user", { timeout: 100 }).contains("foobar005b1");
			});
		});
		it("immediately sends a message triggered by a gallery template button", () => {
			cy.withMessageFixture("gallery", () => {
				cy.contains("foobar004g1b1").focus();
				cy.contains("foobar004g1b1").click();
				cy.get(".webchat-message-row.user", { timeout: 100 }).contains("foobar004g1b1");
			});
		});
		it("immediately sends a message triggered by a list template button", () => {
			cy.withMessageFixture("list-with-postback", () => {
				cy.contains("foobar00rty1").focus();
				cy.contains("foobar00rty1").click();
				cy.get(".webchat-message-row.user", { timeout: 100 }).contains("foobar00rty1");
			});
		});
		it("immediately sends a message triggered by a list template item button", () => {
			cy.withMessageFixture("list", () => {
				cy.contains("foobar009l1b1").focus();
				cy.contains("foobar009l1b1").click();
				cy.get(".webchat-message-row.user", { timeout: 100 }).contains("foobar009l1b1");
			});
		});
		it("immediately sends a message triggered by a date picker", () => {
			cy.withMessageFixture("date-picker", () => {
				cy.contains("foobar012b1").click();
				cy.get(".flatpickr-day.today").click();
				cy.contains("foobar012b3").click();

				// Our default locale for english is "en-US"
				const formattedDate = moment().format("MM/DD/YYYY");
				cy.get(".webchat-message-row.user", { timeout: 500 }).contains(formattedDate);
			});
		});
	});
});
