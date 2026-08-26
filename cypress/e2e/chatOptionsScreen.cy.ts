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

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("chat options screen (all sections) has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					chatOptions: {
						enabled: true,
						quickReplyOptions: {
							enabled: true,
							quickReplies: [
								{ type: "postback", title: "Quick Reply", payload: "qr1" },
							],
						},
						showTTSToggle: true,
						rating: { enabled: "always" },
						enableDeleteConversation: true,
						footer: {
							enabled: true,
							items: [{ title: "Privacy", url: "https://example.com" }],
						},
					},
				},
			});
			cy.openWebchat();
			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-chat-options-root").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		// CGY-4039: the TTS toggle must be a focusable, labelled switch that announces its state
		it("TTS toggle is a labelled switch announcing its state", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					chatOptions: { enabled: true, showTTSToggle: true },
				},
			});
			cy.openWebchat();
			cy.get("[data-header-menu-button]").click();

			cy.get(".webchat-chat-options-tts-option-toggle")
				.should("have.attr", "role", "switch")
				.and("have.attr", "type", "button")
				.and("have.attr", "aria-checked", "false");

			// programmatic label is the visible heading, linked via aria-labelledby
			cy.get(".webchat-chat-options-tts-option-toggle").then($toggle => {
				const labelId = $toggle.attr("aria-labelledby");
				expect(labelId).to.be.a("string").and.not.be.empty;
				cy.get(`[id="${labelId}"]`).should("contain.text", "Enable Text-to-Speech");
			});

			// the toggle is keyboard-focusable in the reading order after the heading
			cy.get(".webchat-chat-options-tts-option-toggle").focus();
			cy.focused().should("have.class", "webchat-chat-options-tts-option-toggle");

			// state changes are exposed programmatically via aria-checked
			cy.get(".webchat-chat-options-tts-option-toggle")
				.click()
				.should("have.attr", "aria-checked", "true");
			cy.get(".webchat-chat-options-tts-option-toggle")
				.click()
				.should("have.attr", "aria-checked", "false");
		});

		it("delete-conversation confirmation modal has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					chatOptions: { enabled: true, enableDeleteConversation: true },
				},
			});
			cy.openWebchat();
			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-delete-conversation-button").click();
			cy.get(".webchat-modal-root").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("delete-conversation modal is aria-modal, traps focus and closes on Escape", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					chatOptions: { enabled: true, enableDeleteConversation: true },
				},
			});
			cy.openWebchat();
			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-delete-conversation-button").click();

			cy.get(".webchat-modal-root")
				.should("have.attr", "role", "dialog")
				.should("have.attr", "aria-modal", "true");
			// Focus lands on the safe default action (Cancel, via autoFocus)
			cy.get(".webchat-delete-confirmation-cancel-button").should("have.focus");

			// The trap wraps: Tab on the last focusable (Delete) returns to the
			// first (the close X); Shift+Tab on the first wraps back to the last.
			cy.get(".webchat-delete-confirmation-confirm-button")
				.focus()
				.trigger("keydown", { key: "Tab" });
			cy.get(".webchat-modal-close-button")
				.should("have.focus")
				.trigger("keydown", { key: "Tab", shiftKey: true });
			cy.get(".webchat-delete-confirmation-confirm-button").should("have.focus");

			cy.focused().type("{esc}");
			cy.get(".webchat-modal-root").should("not.exist");
		});
	});
});
