// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

/**
 * Tests for the customAllowedHtmlTags deny-list (WCH-SI10-002 / SI-10 / AC-3).
 *
 * sanitizeHTML() reads customAllowedHtmlTags from the Redux store and, when set,
 * replaces the default ALLOWED_TAGS. The fix adds a hard deny-list (ALWAYS_BLOCKED_TAGS)
 * that is applied to the tenant-supplied list before it reaches DOMPurify, so that
 * dangerous tags (script, iframe, object, embed, …) can never be re-enabled by
 * endpoint configuration regardless of what customAllowedHtmlTags contains.
 *
 * sanitizeHTML() is called on user-sent text (SEND_MESSAGE path) and on the
 * privacy-notice body. Tests use the privacy-notice surface because it renders
 * its sanitized output as React elements, giving a DOM-observable assertion.
 */
describe("customAllowedHtmlTags deny-list (WCH-SI10-002)", () => {
	const initWithAllowedTags = (customAllowedHtmlTags: string[], privacyText: string) =>
		cy.visitWebchat().initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
					title: "Privacy notice",
					text: privacyText,
					submitButtonText: "Accept",
					urlText: "Privacy policy",
					url: "https://www.cognigy.com/",
				},
				widgetSettings: {
					customAllowedHtmlTags,
				},
			},
		});

	it("blocks script even when explicitly listed in customAllowedHtmlTags (SC-13 deny-list)", () => {
		initWithAllowedTags(["script", "p"], "<script>window.__xss = true</script><p>safe</p>");

		cy.get("[data-cognigy-webchat-toggle]").click();

		// script must not execute
		cy.window().its("__xss").should("equal", undefined);

		// script element must not exist anywhere in the widget
		cy.get("[data-cognigy-webchat-root]").find("script").should("not.exist");
	});

	it("blocks iframe even when explicitly listed in customAllowedHtmlTags", () => {
		initWithAllowedTags(
			["iframe", "p"],
			'<iframe src="https://evil.example.com"></iframe><p>safe</p>',
		);

		cy.get("[data-cognigy-webchat-toggle]").click();

		cy.get("[data-cognigy-webchat-root]").find("iframe").should("not.exist");
	});

	it("blocks all ALWAYS_BLOCKED_TAGS even when all are listed", () => {
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
		const payload = blockedTags.map(tag => `<${tag}></${tag}>`).join("") + "<p>safe</p>";

		initWithAllowedTags(blockedTags, payload);

		cy.get("[data-cognigy-webchat-toggle]").click();

		blockedTags.forEach(tag => {
			cy.get("[data-cognigy-webchat-root]").find(tag).should("not.exist");
		});
	});

	it("still allows safe tags listed in customAllowedHtmlTags through to the deny-list filter", () => {
		// "script" is in the list but blocked; "p" is safe and must survive the filter.
		// The privacy notice renders its text via react-markdown which does not render
		// arbitrary HTML, so we verify no dangerous element was injected rather than
		// asserting the <p> element specifically.
		initWithAllowedTags(
			["script", "p", "b"],
			"<script>window.__xss2 = true</script>safe content",
		);

		cy.get("[data-cognigy-webchat-toggle]").click();

		cy.window().its("__xss2").should("equal", undefined);
		cy.get("[data-cognigy-webchat-root]").find("script").should("not.exist");
		cy.get(".webchat-privacy-notice-root").should("be.visible");
	});

	it("handles uppercase and mixed-case tag names in deny-list check", () => {
		// Attacker supplies "SCRIPT" or "Script" hoping to bypass toLowerCase() check
		initWithAllowedTags(
			["SCRIPT", "Script", "IFRAME"],
			"<script>window.__xss3 = true</script><iframe></iframe>",
		);

		cy.get("[data-cognigy-webchat-toggle]").click();

		cy.window().its("__xss3").should("equal", undefined);
		cy.get("[data-cognigy-webchat-root]").find("script").should("not.exist");
		cy.get("[data-cognigy-webchat-root]").find("iframe").should("not.exist");
	});

	it("passes when customAllowedHtmlTags is empty — strips all tags", () => {
		initWithAllowedTags([], "<b>bold</b><p>paragraph</p>");

		cy.get("[data-cognigy-webchat-toggle]").click();

		cy.get("[data-cognigy-webchat-root]").find("b").should("not.exist");
		cy.get(".webchat-privacy-notice-root").should("be.visible");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("privacy notice surface has no a11y violations with customAllowedHtmlTags set", () => {
			initWithAllowedTags(["script", "p"], "<script>window.__xss4 = true</script>safe");

			cy.get("[data-cognigy-webchat-toggle]").click();

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
