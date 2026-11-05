import { itChromiumOnly } from "../support/browser";

describe("Webchat Message Input", () => {
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

		it("persistent menu toggle is a native button that exposes its expanded state and keeps focus on close (CGY-39786)", () => {
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

			// closing via the toggle leaves focus on the toggle (APG disclosure,
			// SC 2.4.3) — it must not jump to the remounted message input
			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-expanded",
				"false",
			);
			cy.get(".webchat-input-persistent-menu").should("not.exist");
			cy.get(".webchat-input-message-input").should("exist");
			cy.focused().should("have.class", "webchat-input-persistent-menu-button");
		});

		it("closing the persistent menu before the initial autofocus timer fires keeps focus on the toggle (CGY-39786)", () => {
			cy.visitWebchat().initMockWebchat(persistentMenuOptions);
			// Freeze timers so the toggle is used inside the input's 200ms
			// deferred-autofocus window (BaseInput.componentDidMount), which is
			// what a user does when opening the menu right after entering the chat
			cy.clock(Date.now(), ["setTimeout", "clearTimeout"]);
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("exist");

			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-expanded",
				"true",
			);
			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu-button").should(
				"have.attr",
				"aria-expanded",
				"false",
			);
			cy.get(".webchat-input-message-input").should("exist");
			cy.focused().should("have.class", "webchat-input-persistent-menu-button");

			// Past the deadline the pending autofocus must not have fired: the
			// user chose where focus is (SC 2.4.3, SC 3.2.1)
			cy.tick(300);
			cy.focused().should("have.class", "webchat-input-persistent-menu-button");
			cy.get(".webchat-input-message-input").should("not.be.focused");
		});

		itChromiumOnly(
			"persistent menu opened and closed with the keyboard keeps focus on the toggle (CGY-39786)",
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
				cy.focused().should("have.class", "webchat-input-persistent-menu-button");

				cy.realPress("Space");
				cy.get(".webchat-input-persistent-menu-button").should(
					"have.attr",
					"aria-expanded",
					"false",
				);
				cy.focused().should("have.class", "webchat-input-persistent-menu-button");
			},
		);

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
