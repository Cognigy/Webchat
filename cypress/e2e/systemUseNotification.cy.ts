// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

/**
 * End-to-end tests for the System Use Notification (SUN) feature.
 * AC-8 / FedRAMP — WCH-AC8-001 / CSA-97598.
 *
 * The SUN is a pre-session acceptance gate shown before every new conversation.
 * It is separate from the GDPR PrivacyNotice: different config section, different
 * persistence (per sessionId not per userId), and different customer segment.
 */
describe("System Use Notification (WCH-AC8-001)", () => {
	const sunSettings = {
		systemUseNotification: {
			enabled: true,
			title: "System Use Notification",
			text: "You are accessing a U.S. Government information system.",
			submitButtonText: "I acknowledge and accept",
		},
	};

	describe("Rendering", () => {
		it("shows the SUN screen when systemUseNotification.enabled is true", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		it("does NOT show the SUN screen when systemUseNotification.enabled is false", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: false,
						title: "",
						text: "",
						submitButtonText: "",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("allows title customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "Custom SUN Title 456",
						text: "Notice text",
						submitButtonText: "Accept",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-header-title").should("have.text", "Custom SUN Title 456");
		});

		it("allows notice text customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "SUN",
						text: "Custom SUN text content 789",
						submitButtonText: "Accept",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-message").should(
				"contain.text",
				"Custom SUN text content 789",
			);
		});

		it("allows accept button text customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "SUN",
						text: "Notice",
						submitButtonText: "Custom Accept Label",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").should(
				"have.text",
				"Custom Accept Label",
			);
		});
	});

	describe("Accept flow", () => {
		it("dismisses the SUN screen after the user clicks accept", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("shows the chat history after accepting (socket connects)", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
		});

		it("blocks user messages until the SUN is accepted", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			// SUN is visible — no chat history yet
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get("#webchatChatHistory").should("not.exist");
		});
	});

	describe("Per-session gating", () => {
		it("does not show the SUN again on page refresh within the same session", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings }).openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");

			// Re-init the webchat (simulates page reload with same sessionId in storage)
			cy.initMockWebchat({ settings: sunSettings }).openWebchat();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});
	});

	describe("Ordering with PrivacyNotice", () => {
		it("shows SUN before the PrivacyNotice when both are enabled", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					privacyNotice: { enabled: true, title: "Privacy notice", text: "GDPR text" },
				},
			});
			cy.openWebchat();
			cy.startConversation();
			// SUN must appear first
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-privacy-notice-root").should("not.exist");

			// After accepting SUN, PrivacyNotice should appear
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
			cy.get(".webchat-privacy-notice-root").should("be.visible");
		});
	});

	describe("Session switch", () => {
		it("shows SUN again after switchSession and defers socket switch until acceptance", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");

			// Switch to a new session (simulates switching conversations)
			cy.window().then(win => {
				win.cognigyWebchat.switchSession();
			});

			// SUN should appear again
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get("#webchatChatHistory").should("not.exist");
		});
	});

	describe("Previous Conversations interaction", () => {
		it("does not show the delete-all-conversations button while SUN is pending", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					homeScreen: { enabled: true, previousConversations: { enableDeleteAllConversations: true } },
				},
			});
			cy.openWebchat();
			cy.startConversation();
			// SUN is visible — delete button should not be visible yet
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-delete-all-conversations-button").should("not.exist");
		});

		it("re-hides the delete-all button after switchSession resets SUN acceptance", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					homeScreen: { enabled: true, previousConversations: { enableDeleteAllConversations: true } },
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.get(".webchat-delete-all-conversations-button").should("be.visible");

			// Switch session
			cy.window().then(win => {
				win.cognigyWebchat.switchSession();
			});

			// SUN shows again, delete button should be hidden
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-delete-all-conversations-button").should("not.exist");
		});

		it("opening from teaser shows SUN, not chat history", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			// Close the webchat so teaser can be shown
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			// Send a message so there's something to show in the teaser
			cy.get(".webchat-message-input").type("test message");
			cy.get(".webchat-message-input").parent().find("button[type='submit']").click();
			cy.get(".webchat-toggle-button").click(); // Close the webchat

			// Now open from teaser
			cy.get(".webchat-teaser-message-root").should("be.visible");
			cy.get(".webchat-teaser-message-bubble").click(); // Click the teaser
			// SUN should show again because it's a new session
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get("#webchatChatHistory").should("not.exist");
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("SUN surface has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("chat surface after SUN acceptance has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
