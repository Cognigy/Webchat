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
});
