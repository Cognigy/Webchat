describe("Webchat Message Input", () => {
	it("message input filed should have correct aria-label", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.get('[aria-label="Type something here…"]').should("be.visible");
	});

	it("message input filed should receive focus on open", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.get('[aria-label="Type something here…"]').should("be.focused");
	});

	it("should be able to type in message input filed should", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.get('[aria-label="Type something here…"]').type("Hi");
		cy.get('[aria-label="Type something here…"]').should("have.value", "Hi");
	});
});
