describe("Chat Options Screen", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("is not displayed when menu button is not visible", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: false,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").should("not.exist");
	});

	it("opens when menu button is clicked", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-chat-options-root").should("exist");
	});

	it("has default title when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("h2").contains("Chat options");
	});

	it("has custom title when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					title: "Settings Menu",
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("h2").contains("Settings Menu");
	});

	it("displays back button to return to chat", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("[data-header-back-button]").should("exist");
	});

	it("returns to chat when back button is clicked", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("[data-header-back-button]").click();
		cy.get(".webchat-chat-options-root").should("not.exist");
	});

	it("displays quick reply options when enabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					quickReplyOptions: {
						enabled: true,
						quickReplies: [
							{
								type: "postback",
								title: "Quick Reply 1",
								payload: "quick-reply-1",
							},
							{
								type: "postback",
								title: "Quick Reply 2",
								payload: "quick-reply-2",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("button").contains("Quick Reply 1");
		cy.get("button").contains("Quick Reply 2");
	});

	it("does not display quick reply options when disabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					quickReplyOptions: {
						enabled: false,
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-postback-buttons").should("not.exist");
	});

	it("sends message when quick reply button is clicked", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					quickReplyOptions: {
						enabled: true,
						quickReplies: [
							{
								type: "postback",
								title: "Quick Reply Test",
								payload: "quick-reply-test",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get("button").contains("Quick Reply Test").click();
		cy.get(".webchat-message-row.user .chat-bubble", { timeout: 100 }).contains(
			"Quick Reply Test",
		);
	});

	it("displays TTS toggle when enabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					showTTSToggle: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-tts-option-root").should("exist");
	});

	it("does not display TTS toggle when disabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					showTTSToggle: false,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-tts-option-root").should("not.exist");
	});

	it("displays delete conversation button when enabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					enableDeleteConversation: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-delete-conversation-container").should("exist");
	});

	it("does not display delete conversation button when disabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					enableDeleteConversation: false,
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-delete-conversation-container").should("not.exist");
	});

	it("displays footer when enabled and configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					footer: {
						enabled: true,
						items: [
							{
								type: "web_url",
								title: "Privacy Policy",
								url: "https://example.com/privacy",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-chat-options-footer").should("exist");
		cy.get("a").contains("Privacy Policy");
	});

	it("does not display footer when disabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					footer: {
						enabled: false,
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.get(".webchat-chat-options-footer").should("not.exist");
	});

	it("focuses chat options title when opened", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
				chatOptions: {
					enabled: true,
					quickReplyOptions: {
						enabled: true,
						quickReplies: [
							{
								type: "postback",
								title: "First Option",
								payload: "first",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("[data-header-menu-button]").click();
		cy.focused().should("have.id", "webchatHeaderTitle");
	});
});
