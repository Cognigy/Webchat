describe("Webchat Message Input", () => {
	it("message input filed should have correct label", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).should("exist");
			});
	});

	it("message input filed should receive focus on open", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).should("be.focused");
			});
	});

	it("should be able to type in message input filed should", () => {
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
	});
});
