describe("Empty Message", () => {
	beforeEach(() => {
		cy.visitWebchat();

		cy.initMockWebchat({
			settings: {
				behavior: {
					progressiveMessageRendering: true,
					collateStreamedOutputs: false,
				},
			},
		});

		cy.openWebchat().startConversation();
	});

	it("should not render messages with empty text", () => {
		// Simulate adding a message with empty text
		cy.receiveMessage("Hi");
		cy.receiveMessage(" ");
		cy.receiveMessage("How can I help you?");
		cy.wait(1000);
		cy.get("article").should("have.length", 2);
	});

	it("should not render messages with only escape sequences", () => {
		// Simulate adding a message with only escape sequences
		cy.receiveMessage("Hi");
		cy.receiveMessage("\n\t  \n");
		cy.receiveMessage("How can I help you?");
		cy.receiveMessage(" \n\n");
		cy.wait(1000); // wait for rendering
		cy.get("article").should("have.length", 2);
	});
});
