// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

/**
 * Consolidated accessibility (WCAG 2.2 AA) smoke tests.
 *
 * Runs the `cy.checkA11yCompliance()` command (cypress-axe, configured for
 * wcag2a/2aa, wcag21a/aa, wcag22a/aa + best-practice in cypress/support/commands.ts)
 * across the main Webchat views and the common message renderers in a real
 * browser — so contrast, ARIA relationships and computed roles are all checked.
 *
 * This complements the static jsx-a11y lint gate. Each view/message type gets
 * its own `it` so a regression points at a specific surface. New UI work should
 * add a `checkA11yCompliance()` assertion here or in the relevant feature spec
 * (see docs/accessibility.md — Definition of Done).
 */
describe("Accessibility (WCAG 2.2 AA)", () => {
	describe("Core views", () => {
		it("home screen has no detectable a11y violations", () => {
			cy.visitWebchat();
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: true },
				},
			});
			cy.openWebchat();
			cy.get("h2").contains("Chat window home screen").should("exist");
			cy.checkA11yCompliance();
		});

		it("chat input / conversation view has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
			cy.get('[aria-label="Send message"]').should("be.visible");
			cy.checkA11yCompliance();
		});

		it("privacy notice screen has no detectable a11y violations", () => {
			cy.visitWebchat();
			cy.initMockWebchat({
				settings: {
					privacyNotice: { enabled: true },
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-privacy-notice-root").should("be.visible");
			cy.checkA11yCompliance(".webchat-privacy-notice-root");
		});
	});

	describe("Message renderers", () => {
		beforeEach(() => {
			cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
		});

		it("text message has no detectable a11y violations", () => {
			cy.withMessageFixture("text", () => {
				cy.contains("foobar001");
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("quick replies have no detectable a11y violations", () => {
			cy.withMessageFixture("quick-replies", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("buttons message has no detectable a11y violations", () => {
			cy.withMessageFixture("buttons", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("list message has no detectable a11y violations", () => {
			cy.withMessageFixture("list", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("gallery message has no detectable a11y violations", () => {
			cy.withMessageFixture("gallery", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("image message has no detectable a11y violations", () => {
			cy.withMessageFixture("image", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});

		it("date picker message has no detectable a11y violations", () => {
			cy.withMessageFixture("date-picker", () => {
				cy.checkA11yCompliance(".webchat-chat-history");
			});
		});
	});
});
