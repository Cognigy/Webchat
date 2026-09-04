describe("Webchat Message Input", () => {
	// cypress-real-events dispatches real key events over CDP — Chromium only. The
	// Firefox run keeps every assertion that does not need a native key press.
	const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;

	const persistentMenuOptions = {
		settings: {
			homeScreen: { enabled: false },
			layout: {
				enablePersistentMenu: true,
				persistentMenu: {
					title: "Chat Menu",
					menuItems: [
						{ title: "Option 1", payload: "opt1" },
						{ title: "Option 2", payload: "opt2" },
					],
				},
			},
		},
	};

	it("message input field should have correct label", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).should("exist");
			});
	});

	it("message input field should receive focus on open", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).should("be.focused");
			});
	});

	it("should be able to type in message input field", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type("Hi");
				cy.get(`#${inputId}`).should("have.value", "Hi");
			});
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("conversation view (header + input) has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					privacyNotice: { enabled: false },
				},
			});
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("open persistent menu has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					layout: {
						enablePersistentMenu: true,
						persistentMenu: {
							title: "Chat Menu",
							menuItems: [
								{ title: "Option 1", payload: "opt1" },
								{ title: "Option 2", payload: "opt2" },
							],
						},
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("persistent menu toggle is a native button that exposes its expanded state and returns focus to the input on close", () => {
			cy.visitWebchat().initMockWebchat(persistentMenuOptions);
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.focused");

			cy.get(".webchat-input-persistent-menu-button")
				.should("match", "button")
				.and("have.attr", "type", "button")
				.and("have.attr", "aria-label", "Toggle chat input menu")
				.and("have.attr", "aria-expanded", "false");

			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-expanded",
				"true",
			);
			// the menu does not steal focus: the toggle keeps it, the items follow in tab order
			cy.focused().should("have.class", "webchat-input-persistent-menu-button");

			// items are a labelled group of native buttons (Enter/Space for free)
			cy.get(".webchat-input-persistent-menu [role=group]").should(
				"have.attr",
				"aria-labelledby",
				"persistentMenuTitle",
			);
			cy.get("#persistentMenuTitle").should("have.text", "Chat Menu");
			cy.get(".webchat-input-persistent-menu-item")
				.should("have.length", 2)
				.each($item => expect($item[0].tagName).to.equal("BUTTON"));

			// closing via the toggle hands focus back to the message input (SC 2.4.3)
			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-expanded",
				"false",
			);
			cy.get(".webchat-input-persistent-menu").should("not.exist");
			cy.focused().should("have.class", "webchat-input-message-input");
		});

		itChromiumOnly(
			"persistent menu is keyboard-operable: Tab reaches the items, Enter sends one and focus returns to the input",
			() => {
				cy.visitWebchat().initMockWebchat(persistentMenuOptions);
				cy.openWebchat().startConversation();
				cy.get(".webchat-input-message-input").should("be.focused");

				cy.get(".webchat-input-persistent-menu-button").focus();
				cy.realPress("Enter");
				cy.get(".webchat-input-persistent-menu-button").should(
					"have.attr",
					"aria-expanded",
					"true",
				);

				cy.realPress("Tab");
				cy.focused()
					.should("have.class", "webchat-input-persistent-menu-item")
					.and("contain.text", "Option 1");

				cy.realPress("Enter");
				cy.get(".webchat-message-row.user").should("contain.text", "Option 1");
				cy.get(".webchat-input-persistent-menu-button").should(
					"have.attr",
					"aria-expanded",
					"false",
				);
				cy.focused().should("have.class", "webchat-input-message-input");
			},
		);

		it("honors the configurable togglePersistentMenu aria label", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...persistentMenuOptions.settings,
					customTranslations: {
						ariaLabels: { togglePersistentMenu: "Chatmenü umschalten" },
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-label",
				"Chatmenü umschalten",
			);
		});
	});
});
