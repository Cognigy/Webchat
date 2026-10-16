/**
 * disableHtmlInput (default: true) makes user input plain text.
 *
 * Two contracts are tested here, and both are needed:
 *
 * 1. Wire: the endpoint receives the text exactly as typed, minus HTML tags.
 *    No entities are added and none are decoded. Webchat v3.48.0 (PR #294)
 *    escaped the text before sending, so flows, intents and logs received
 *    "&amp;" for every "&". This broke "Trigger Intent" buttons such as
 *    `cIntent:Tools & Access` (CGY-36060, CGY-40199). The bubble still looked
 *    correct, so DOM-only tests did not catch it: assert on the payload passed
 *    to sendMessage.
 *
 * 2. DOM: user text never becomes markup. chat-components escapes user text
 *    at render time, so no element is created, live or replayed from history.
 */
// The parts of the Webchat instance these tests use.
type WebchatHandle = {
	client: { sendMessage: (text: string, data: object | null) => void };
	store: { dispatch: (action: object) => void };
};

describe("disableHtmlInput", () => {
	const init = () =>
		cy
			.visitWebchat()
			.initMockWebchat({
				settings: {
					widgetSettings: {
						disableHtmlInput: true,
					},
				},
			})
			.openWebchat()
			.startConversation();

	// Replaces the socket send, so the test can read the exact outgoing payload.
	const stubSendMessage = () =>
		cy.getWebchat().then(webchat => {
			cy.stub((webchat as unknown as WebchatHandle).client, "sendMessage").as("sendMessage");
		});

	const typeAndSend = (value: string) => {
		cy.get(".webchat-input-message-label")
			.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type(value, { parseSpecialCharSequences: false });
			});
		cy.get('[aria-label="Send message"]').click();
	};

	const expectSent = (text: string) =>
		cy.get("@sendMessage").should("have.been.calledOnceWith", text, null);

	describe("wire payload (what the endpoint and the flow receive)", () => {
		// Every row was HTML-encoded on the wire in v3.48.0 – v3.53.0. The
		// query string row also guards against entity decoding: "&region" and
		// "&section" are legacy entity names ("®", "§") to an HTML parser.
		const sentUnchanged = [
			"foo & bar",
			"cIntent:Tools & Access",
			"a < b & c",
			"I <3 you & your team",
			"price < 5 & qty > 2",
			"see https://example.com/?a=1&region=eu&section=2",
		];

		sentUnchanged.forEach(text => {
			it(`sends "${text}" exactly as typed`, () => {
				init();
				stubSendMessage();
				typeAndSend(text);
				expectSent(text);
				// The bubble shows the same text.
				cy.get(".webchat-chat-history").contains(text);
			});
		});

		it("strips real tags and sends the remaining text without entities", () => {
			init();
			stubSendMessage();
			typeAndSend("<b>bold</b> & co");
			expectSent("bold & co");
		});

		// Typed entities are text, so they are sent as typed, not decoded.
		it("sends typed entities as typed", () => {
			init();
			stubSendMessage();
			typeAndSend("Tom &amp; Jerry");
			expectSent("Tom &amp; Jerry");
		});

		// The #294 payload must not be decoded into a real <img> tag on the wire:
		// flows, Live Agent and Insights could render it as markup.
		it("sends an entity-encoded tag as typed, never as a real tag", () => {
			init();
			stubSendMessage();
			typeAndSend("&#60;img src=x onerror=alert(1)&#62;");
			expectSent("&#60;img src=x onerror=alert(1)&#62;");
		});

		// The HTML parser does not decode entities inside raw-text elements such
		// as <script> and <style>. Escaping "&" before parsing therefore leaked
		// "&amp;" into the payload from inside them: "&" must survive there too.
		const rawTextCases: [string, string][] = [
			["before<script>Tom & Jerry</script> after", "beforeTom & Jerry after"],
			["x<style>a & b</style>y", "xa & by"],
		];
		rawTextCases.forEach(([typed, sent]) => {
			it(`keeps & as typed inside a raw-text element: ${typed}`, () => {
				init();
				stubSendMessage();
				typeAndSend(typed);
				expectSent(sent);
			});
		});

		// One strip pass would turn "<<b>img …>" into a real "<img …>" tag.
		it("does not let nested tags reassemble into markup", () => {
			init();
			stubSendMessage();
			typeAndSend("hi <<b>img src=x onerror=alert(1)>");
			expectSent("hi ");
		});

		// Postback buttons send their payload through the same path. This is the
		// Foundever case (CGY-40199): the intent name must match exactly.
		it("sends a quick reply payload with & unchanged", () => {
			init();
			stubSendMessage();
			cy.receiveMessage("Pick a topic", {
				_cognigy: {
					_webchat: {
						message: {
							text: "Pick a topic",
							quick_replies: [
								{
									content_type: "text",
									title: "Tools & Access",
									payload: "cIntent:Tools & Access",
								},
							],
						},
					},
				},
			});
			cy.contains("button", "Tools & Access").click();
			cy.get("@sendMessage").should(
				"have.been.calledOnceWith",
				"cIntent:Tools & Access",
				null,
			);
			// The user bubble shows the button label, not the payload. Scoped to
			// the user row: the clicked button itself also stays in the history.
			cy.get(".webchat-message-row.user").contains("Tools & Access");
		});
	});

	describe("rendering (user text never becomes markup)", () => {
		it("renders an entity-encoded <img> payload as inert text, not a live element", () => {
			init();
			typeAndSend("&#60;img src=x onerror=alert(1)&#62;");

			// The payload is shown as typed, as inert text in the history...
			cy.get(".webchat-message-row.user").contains("&#60;img src=x onerror=alert(1)&#62;");
			// ...and no live element is created anywhere in the widget from it
			cy.get("[data-cognigy-webchat-root]").find('img[src="x"]').should("not.exist");
		});

		it("neutralizes a doubly entity-encoded <img> payload to inert text", () => {
			init();
			typeAndSend("&amp;#60;img src=x onerror=alert(1)&amp;#62;");

			// Nested encoding must never reconstruct a live element downstream
			cy.get(".webchat-message-row.user").contains("onerror=alert(1)");
			cy.get("[data-cognigy-webchat-root]").find('img[src="x"]').should("not.exist");
		});

		// With both flags on, chat-components skips render-time sanitization for
		// user text. The plain text escaping must still apply, or a decoded tag
		// would run its onerror handler.
		it("keeps user text inert with disableTextInputSanitization also on", () => {
			cy.visitWebchat()
				.initMockWebchat({
					settings: {
						widgetSettings: {
							disableHtmlInput: true,
							disableTextInputSanitization: true,
						},
					},
				})
				.openWebchat()
				.startConversation();
			typeAndSend("&#60;img src=x onerror=alert(1)&#62;");
			cy.receiveMessage("Confirm?", {
				_cognigy: {
					_webchat: {
						message: {
							text: "Confirm?",
							quick_replies: [
								{
									content_type: "text",
									title: "&lt;img src=x onerror=alert(1)&gt;",
									payload: "yes",
								},
							],
						},
					},
				},
			});
			cy.contains("button", "onerror=alert(1)").click();
			cy.get(".webchat-message-row.user").should("have.length", 2);
			cy.get(".webchat-chat-history")
				.find('.webchat-message-row.user img[src="x"]')
				.should("not.exist");
		});

		it("still strips a real tag down to its text (regression guard)", () => {
			init();
			typeAndSend("<b>bold</b>");
			cy.get(".webchat-chat-history").contains("bold");
			cy.get("[data-cognigy-webchat-root]").find("b").should("not.exist");
		});

		it("does not double-encode plain ampersands", () => {
			init();
			typeAndSend("hello & goodbye");
			cy.get(".webchat-chat-history").contains("hello & goodbye");
			cy.get(".webchat-chat-history").contains("&amp;").should("not.exist");
		});

		// Since the wire carries plain text, a user message from persisted history
		// can contain literal markup characters. Escaping happens at render time,
		// so it must hold for messages that never passed through SEND_MESSAGE.
		it("renders a user message from history as text, not markup", () => {
			init();
			cy.getWebchat().then(webchat => {
				(webchat as unknown as WebchatHandle).store.dispatch({
					type: "ADD_MESSAGE",
					message: { text: "<img src=x onerror=alert(1)> & co", source: "user" },
				});
			});
			cy.get(".webchat-chat-history").contains("<img src=x onerror=alert(1)> & co");
			cy.get("[data-cognigy-webchat-root]").find('img[src="x"]').should("not.exist");
		});

		// Postback labels are display-only. In plain text mode the bubble is
		// escaped, so the label's tags are stripped first instead of shown.
		it("shows a quick reply label without its HTML tags", () => {
			init();
			cy.receiveMessage("Confirm?", {
				_cognigy: {
					_webchat: {
						message: {
							text: "Confirm?",
							quick_replies: [
								{ content_type: "text", title: "<b>Yes</b>", payload: "yes" },
							],
						},
					},
				},
			});
			cy.contains("button", "Yes").click();
			cy.get(".webchat-message-row.user").contains("Yes");
			cy.get(".webchat-message-row.user").contains("<b>").should("not.exist");
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("input surface has no a11y violations after sending", () => {
			init();
			typeAndSend("<b>bold</b>");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
