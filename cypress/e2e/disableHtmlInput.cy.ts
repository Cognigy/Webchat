describe("disableHtmlInput", () => {
	const init = () =>
		cy
			.visitWebchat()
			.initMockWebchat({
				settings: {
					widgetSettings: {
						disableHtmlInput: true,
					},
				},
			})
			.openWebchat()
			.startConversation();

	const typeAndSend = (value: string) => {
		cy.get(".webchat-input-message-label")
			.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type(value, { parseSpecialCharSequences: false });
			});
		cy.get('[aria-label="Send message"]').click();
	};

	it("renders an entity-encoded <img> payload as inert text, not a live element", () => {
		init();
		typeAndSend("&#60;img src=x onerror=alert(1)&#62;");

		// No live element is created anywhere in the widget from the payload
		cy.get("[data-cognigy-webchat-root]").find('img[src="x"]').should("not.exist");
		// The payload is shown as literal, inert text in the history
		cy.get(".webchat-chat-history").contains("onerror=alert(1)");
	});

	it("neutralizes a doubly entity-encoded <img> payload to inert text", () => {
		init();
		typeAndSend("&amp;#60;img src=x onerror=alert(1)&amp;#62;");

		// Nested encoding must never reconstruct a live element downstream
		cy.get("[data-cognigy-webchat-root]").find('img[src="x"]').should("not.exist");
		cy.get(".webchat-chat-history").contains("onerror=alert(1)");
	});

	it("still strips a real tag down to its text (regression guard)", () => {
		init();
		typeAndSend("<b>bold</b>");
		cy.get(".webchat-chat-history").contains("bold");
		cy.get("[data-cognigy-webchat-root]").find("b").should("not.exist");
	});

	it("does not double-encode plain ampersands", () => {
		init();
		typeAndSend("hello & goodbye");
		cy.get(".webchat-chat-history").contains("hello & goodbye");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("input surface has no a11y violations after sending", () => {
			init();
			typeAndSend("<b>bold</b>");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
