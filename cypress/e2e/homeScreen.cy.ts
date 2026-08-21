describe("Home Screen", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("is not displayed when it is disabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: false,
				},
			},
		});
		cy.openWebchat();
		cy.get("h2").contains("Chat window home screen").should("not.exist");
	});

	it("is displayed when it is enabled", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("h2").contains("Chat window home screen");
	});

	it("has default logo displayed when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("svg title").should("have.text", "Cognigy.AI Logo");
	});

	it("has specified logo displayed when configured", () => {
		cy.initMockWebchat({
			settings: {
				layout: {
					logoUrl: "https://placewaifu.com/image/300/300",
				},
				homeScreen: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("img").should("have.attr", "src", "https://placewaifu.com/image/300/300");
	});

	it("has welcome text displayed when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
				},
			},
		});
		cy.openWebchat();
		cy.get("h3").contains("Welcome to the home screen");
	});

	it("does not have welcome text displayed when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
				},
			},
		});
		cy.openWebchat();
		cy.get("h3").contains("Welcome to the home screen").should("not.exist");
	});

	it("has default background gradient when image is not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
				},
			},
		});
		cy.openWebchat();
		cy.get(".webchat-homescreen-content").should(
			"have.css",
			"background-image",
			"none, radial-gradient(204.5% 136.79% at 0.53% 95.79%, rgb(237, 236, 249) 0%, rgb(191, 186, 255) 31.77%, rgb(33, 82, 227) 65.63%, rgb(5, 48, 158) 100%)",
		);
	});

	it("has specified background gradient when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					background: {
						color: "linear-gradient(to right, #ff0000, #0000ff)",
					},
				},
			},
		});
		cy.openWebchat();
		cy.get(".webchat-homescreen-content").should(
			"have.css",
			"background-image",
			"none, linear-gradient(to right, rgb(255, 0, 0), rgb(0, 0, 255))",
		);
	});

	it("has the specified background color when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					background: {
						color: "red",
					},
				},
			},
		});
		cy.openWebchat();
		cy.get(".webchat-homescreen-content").should(
			"have.css",
			"background-color",
			"rgb(255, 0, 0)",
		);
	});

	it("has the specified background image when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					background: {
						imageUrl: "https://placewaifu.com/image/300/300",
					},
				},
			},
		});
		cy.openWebchat().wait(5000);
		cy.get(".webchat-homescreen-content").should(
			"have.css",
			"background-image",
			'url("https://placewaifu.com/image/300/300"), radial-gradient(204.5% 136.79% at 0.53% 95.79%, rgb(237, 236, 249) 0%, rgb(191, 186, 255) 31.77%, rgb(33, 82, 227) 65.63%, rgb(5, 48, 158) 100%)',
		);
	});

	it("has the specified start conversation button text when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					startConversationButtonText: "Start the conversation",
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("Start the conversation");
	});

	it("has the default start conversation button text when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("Start conversation");
	});

	it("has the previous conversations button displayed when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					previousConversations: {
						enabled: true,
						buttonText: "View previous conversations",
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("View previous conversations");
	});

	it("does not have the previous conversations button displayed when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("View previous conversations").should("not.exist");
	});

	it("has default button text for previous conversation when not configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					previousConversations: {
						enabled: true,
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("Previous conversations");
	});

	it("has the specified title for previous conversations when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					previousConversations: {
						enabled: true,
						buttonText: "View previous conversations",
						title: "My Previous conversations",
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("View previous conversations").click();
		cy.get("h2").contains("My Previous conversations");
	});

	it("has the conversation starters displayed when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					conversationStarters: {
						enabled: true,
						starters: [
							{
								type: "postback",
								title: "Postback starter",
								payload: "postback-payload",
							},
							{
								type: "web_url",
								title: "Web URL starter",
								url: "https://www.google.com",
							},
							{
								type: "phone_number",
								title: "Phone number starter",
								payload: "123456789",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("Postback starter");
		cy.get("a").contains("Web URL starter");
		cy.get("a").contains("Phone number starter");
	});

	it("has postback buttons that starts a conversation when clicked", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					conversationStarters: {
						enabled: true,
						starters: [
							{
								type: "postback",
								title: "Postback starter",
								payload: "postback-payload",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("Postback starter").click();
		cy.get(".webchat-message-row.user .chat-bubble", { timeout: 100 }).contains(
			"Postback starter",
		);
	});

	// As of @cognigy/chat-components 0.77.0 (AB#105550), action buttons have no aria-label;
	// the accessible name is formed from DOM content (title + sr-only new-tab hint).
	it("has web url button with sr-only new-tab hint when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					conversationStarters: {
						enabled: true,
						starters: [
							{
								type: "web_url",
								title: "Web URL starter",
								url: "https://www.google.com",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		// "not.have.attr" must come last: it changes the yielded subject
		// to the attribute value (undefined), breaking chained assertions.
		cy.get(".webchat-homescreen-button")
			.should("contain.text", "Web URL starter")
			.should("contain.text", "Opens in new tab")
			.should("not.have.attr", "aria-label");
	});

	it("has phone number button with tel link when configured", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					welcomeText: "Welcome to the home screen",
					conversationStarters: {
						enabled: true,
						starters: [
							{
								type: "phone_number",
								title: "Phone number starter",
								payload: "123456789",
							},
						],
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("a").contains("Phone number starter");
		cy.get("a").should("have.attr", "href", "tel:123456789");
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root so the bare test
	// host page (no <html lang>/<main>/<h1>) isn't audited. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("home screen has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: { homeScreen: { enabled: true } },
			});
			cy.openWebchat();
			cy.get(".webchat-homescreen-content").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("home screen with conversation starters has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: {
						enabled: true,
						conversationStarters: {
							enabled: true,
							starters: [
								{ type: "postback", title: "Postback starter", payload: "p" },
								{
									type: "web_url",
									title: "Web URL starter",
									url: "https://www.google.com",
								},
							],
						},
					},
				},
			});
			cy.openWebchat();
			cy.get("button").contains("Postback starter");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		// CGY-3278 (WCAG 1.3.2): while another screen is active, the home screen
		// stays mounted behind it for the transition. aria-hidden alone still let
		// NVDA arrow-key browsing reach its content, so the root must also carry
		// `inert` to leave the accessibility tree entirely.
		it("removes the home screen from the accessibility tree while another screen is active (CGY-3278)", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: {
						enabled: true,
						previousConversations: { enabled: true },
					},
				},
			});
			cy.openWebchat();
			cy.get("button").contains("Previous conversations").click();
			// separate assertions: chained attribute assertions can re-subject
			cy.get(".webchat-homescreen-root").should("have.attr", "aria-hidden", "true");
			cy.get(".webchat-homescreen-root").should("have.attr", "inert");
			// tabindex fallback for browsers without inert support
			cy.get(".webchat-homescreen-root button").each($el => {
				cy.wrap($el).should("have.attr", "tabindex", "-1");
			});
		});

		it("exposes the home screen to assistive tech again when navigating back to it (CGY-3278)", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: {
						enabled: true,
						previousConversations: { enabled: true },
					},
				},
			});
			cy.openWebchat();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-homescreen-root").should("have.attr", "inert");
			cy.get("button.webchat-header-back-button").click();
			cy.get(".webchat-homescreen-root button").each($el => {
				cy.wrap($el).should("have.attr", "tabindex", "0");
			});
			// not.have.attr re-subjects the chain — keep these assertions last
			cy.get(".webchat-homescreen-root").should("not.have.attr", "inert");
			cy.get(".webchat-homescreen-root").should("not.have.attr", "aria-hidden");
		});

		// SC 2.4.3: `inert` on the hiding home screen blurs the just-activated
		// Start conversation button. With the input's autofocus disabled nothing
		// else picks focus up, so WebchatUI moves it to the header title.
		it("moves focus to the header title when starting a conversation with input autofocus disabled (CGY-3278)", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: true },
					widgetSettings: { disableInputAutofocus: true },
				},
			});
			cy.openWebchat();
			cy.get("[data-test='webchat-start-chat-button']").click();
			cy.get(".webchat-input-message-input").should("be.visible");
			// the fallback fires 450ms after the home screen hides
			cy.focused().should("have.class", "webchat-header-title");
		});

		// Reopening onto the chat screen mounts the home screen already hidden.
		// Its mount effect must not focus the hidden close button — the inert
		// root keeps it out of getKeyboardFocusableElements' `focusable` list —
		// so the on-open logic focuses the first focusable in the window instead.
		it("does not move focus into the hidden home screen when reopening onto the chat screen (CGY-3278)", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: true },
					widgetSettings: { disableInputAutofocus: true },
				},
			});
			cy.openWebchat();
			cy.get("[data-test='webchat-start-chat-button']").click();
			cy.get(".webchat-input-message-input").should("be.visible");

			// minimize, then reopen via the toggle so the on-open focus logic runs
			cy.get("[data-cognigy-webchat-toggle]").click();
			cy.get(".webchat-input-message-input").should("not.exist");
			cy.get("[data-cognigy-webchat-toggle]").click();
			cy.get(".webchat-input-message-input").should("be.visible");

			// allow any late (200ms/450ms) focus timers to fire before asserting.
			// Assert the positive target (the window's first focusable — the
			// header back button) rather than "not inside the home screen":
			// cy.focused() yields null when focus is lost to <body>, which would
			// fail a .closest() chain with a confusing error instead of a clean
			// assertion.
			cy.wait(600);
			cy.focused().should("have.class", "webchat-header-back-button");
		});
	});
});
