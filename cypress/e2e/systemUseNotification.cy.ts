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
					privacyNotice: {
						enabled: true,
						title: "Privacy notice",
						text: "GDPR text",
					},
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

			// Accept SUN for the first session
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");

			// Start a new conversation (triggers SWITCH_SESSION internally)
			cy.window().then(win => {
				(win as any).cognigyWebchat.endSession();
			});

			// SUN must appear again for the new session
			cy.get(".webchat-system-use-notification-root").should("be.visible");

			// Chat history must not be visible — socket has not switched yet
			cy.get("#webchatChatHistory").should("not.exist");

			// Accept SUN for the new session — socket switch completes, chat resumes
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
		});
	});

	describe("Previous Conversations interaction", () => {
		const prevConvSettings = {
			...sunSettings,
			homeScreen: {
				enabled: true,
				previousConversations: {
					enabled: true,
					buttonText: "Previous conversations",
					enableDeleteAllConversations: true,
				},
			},
		};

		it("does not show the delete-all-conversations button while SUN is pending", () => {
			// The delete-all button in the header must be hidden whenever SUN has not yet
			// been accepted — regardless of whether the previous-conversations screen is
			// active — so the user cannot delete history while the access gate is pending.
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			// SUN is showing — delete-all must be absent
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-header-delete-all-conversations-button").should("not.exist");

			// After acceptance, the button may appear once there are conversations
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("re-hides the delete-all button after switchSession resets SUN acceptance", () => {
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			// Accept SUN for the first session
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");

			// Start a new conversation (SWITCH_SESSION resets hasAcceptedSystemUseNotification)
			cy.window().then(win => {
				(win as any).cognigyWebchat.endSession();
			});

			// SUN reappears — delete-all must be hidden again
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-header-delete-all-conversations-button").should("not.exist");
		});

		it("opening from teaser shows SUN, not chat history", () => {
			// openConversationFromTeaser uses isNoticePending; when SUN is pending it
			// must NOT dispatch SHOW_CHAT_SCREEN (which would connect the socket).
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					teaserMessage: {
						text: "Need help? Chat with us",
						teaserMessageDelay: 0,
					},
				},
			});

			// Wait for teaser to appear, then click to open from teaser
			cy.window().contains("Need help? Chat with us", { timeout: 6000 }).should("be.visible");
			cy.get("[data-cognigy-webchat-toggle]").click();

			// SUN must be shown — socket must not have connected
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
