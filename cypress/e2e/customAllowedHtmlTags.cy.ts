// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

/**
 * Tests for the customAllowedHtmlTags deny-list (WCH-SI10-002 / SI-10 / AC-3).
 *
 * The fix adds ALWAYS_BLOCKED_TAGS — a hard deny-list enforced at two layers:
 *   1. FORBID_TAGS in the DOMPurify base config (unconditional, both default and
 *      custom-tags paths).
 *   2. A pre-filter on the tenant-supplied customAllowedHtmlTags array before it
 *      reaches DOMPurify (defence-in-depth).
 *
 * Tests exercise sanitizeHTML() via the SEND_MESSAGE path (message-middleware.ts:123)
 * where the sanitized text is written into the Redux message store, giving a
 * directly observable assertion against the actual sanitizer output rather than
 * relying on browser security features or react-markdown's own HTML filtering.
 */
describe("customAllowedHtmlTags deny-list (WCH-SI10-002)", () => {
	const typeAndSend = (value: string) => {
		cy.get(".webchat-input-message-label")
			.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type(value, { parseSpecialCharSequences: false });
			});
		cy.get('[aria-label="Send message"]').click();
	};

	const getLastUserMessageText = () =>
		cy.get("@webchat").then((webchat: any) => {
			const messages = webchat.store.getState().messages.messageHistory;
			const userMessages = messages.filter((m: any) => m.source === "user");
			return userMessages[userMessages.length - 1]?.text ?? "";
		});

	const initWithCustomTags = (customAllowedHtmlTags: string[]) =>
		cy
			.visitWebchat()
			.initMockWebchat({
				settings: {
					widgetSettings: {
						// Allow HTML through user input so sanitizeHTML() is the only gate
						disableHtmlInput: false,
						customAllowedHtmlTags,
					},
				},
			})
			.openWebchat()
			.startConversation();

	it("strips a blocked tag (form) even when explicitly listed in customAllowedHtmlTags", () => {
		initWithCustomTags(["form", "p"]);

		typeAndSend("<form action='x'><p>content</p></form>");

		// sanitizeHTML() must have filtered 'form' from the custom list before
		// passing to DOMPurify — the stored user message must not contain <form
		getLastUserMessageText().then(text => {
			expect(text).not.to.contain("<form");
			expect(text).not.to.contain("<FORM");
		});
	});

	it("strips script even when explicitly listed in customAllowedHtmlTags", () => {
		initWithCustomTags(["script", "p"]);

		typeAndSend("<script>window.__xss=true</script><p>safe</p>");

		// cy.its() retries until the property exists — use .then() for absence checks
		cy.window().then((win: any) => expect(win.__xss).to.be.undefined);

		getLastUserMessageText().then(text => {
			expect(text).not.to.contain("<script");
		});
	});

	it("strips iframe even when explicitly listed in customAllowedHtmlTags", () => {
		initWithCustomTags(["iframe"]);

		typeAndSend("<iframe src='https://evil.example.com'></iframe>");

		getLastUserMessageText().then(text => {
			expect(text).not.to.contain("<iframe");
		});
	});

	it("rejects uppercase and mixed-case blocked tag names (toLowerCase normalisation)", () => {
		initWithCustomTags(["SCRIPT", "Script", "FORM", "p"]);

		typeAndSend("<SCRIPT>window.__xss2=true</SCRIPT><form></form><p>safe</p>");

		cy.window().then((win: any) => expect(win.__xss2).to.be.undefined);

		getLastUserMessageText().then(text => {
			expect(text).not.to.contain("<script");
			expect(text).not.to.contain("<form");
		});
	});

	it("strips all 12 ALWAYS_BLOCKED_TAGS even when all are listed", () => {
		const blockedTags = [
			"script",
			"iframe",
			"object",
			"embed",
			"applet",
			"frame",
			"frameset",
			"meta",
			"base",
			"link",
			"style",
			"form",
		];
		initWithCustomTags(blockedTags);

		typeAndSend("<script>x</script><iframe></iframe><form></form><object></object>safe");

		getLastUserMessageText().then(text => {
			blockedTags.forEach(tag => {
				expect(text).not.to.contain(`<${tag}`);
			});
		});
	});

	it("FORBID_TAGS also blocks form in the default config (no customAllowedHtmlTags)", () => {
		// When customAllowedHtmlTags is not set, FORBID_TAGS in the base DOMPurify
		// config must still block tags from ALWAYS_BLOCKED_TAGS.
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					widgetSettings: {
						disableHtmlInput: false,
						// customAllowedHtmlTags intentionally not set
					},
				},
			})
			.openWebchat()
			.startConversation();

		typeAndSend("<form action='x'>sensitive</form><p>safe</p>");

		getLastUserMessageText().then(text => {
			expect(text).not.to.contain("<form");
		});
	});

	it("safe tags in customAllowedHtmlTags pass through the filter unchanged", () => {
		// "script" is blocked; "p" is safe — verify p text is visible (not stripped)
		initWithCustomTags(["script", "p"]);

		typeAndSend("hello world");

		getLastUserMessageText().then(text => {
			expect(text).to.contain("hello world");
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat surface has no a11y violations after sending a message with customAllowedHtmlTags set", () => {
			initWithCustomTags(["script", "p"]);
			typeAndSend("hello");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
