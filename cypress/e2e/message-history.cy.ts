describe("Message History", () => {
	it("assigns unique crypto.randomUUID-based IDs to all incoming messages (SC-13 / WCH-SC13-001)", () => {
		cy.visitWebchat();
		cy.window().then(win => {
			cy.spy(win.crypto, "randomUUID").as("cryptoRandomUUID");
		});
		cy.initMockWebchat().openWebchat().startConversation();

		cy.then(() => {
			for (let i = 1; i <= 5; i++) {
				cy.receiveMessage(`Bot message ${i}`);
			}
		});

		// All 5 messages must be in the DOM — duplicate IDs (React key collisions)
		// would cause messages to overwrite each other and fail these assertions
		for (let i = 1; i <= 5; i++) {
			cy.contains(`Bot message ${i}`).should("exist");
		}

		// crypto.randomUUID must have been called at least once per message received
		cy.get("@cryptoRandomUUID").should((spy: any) => {
			expect(spy.callCount).to.be.gte(5);
		});
	});

	it("automatically scrolls to bottom for new incoming messages", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.then(() => {
			for (let i = 0; i < 20; i++) {
				cy.receiveMessage(`Message ${i + 1}!`);
			}
		});

		cy.contains("Message 20!").should("be.visible");
		cy.contains("Message 1!").should("not.be.visible");
	});

	it("doesn't automatically scrollto bottom for new incoming messages if it wasn't scrolled down before", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.then(() => {
			for (let i = 0; i < 20; i++) {
				cy.receiveMessage(`Message ${i + 1}!`);
			}
		});

		cy.contains("Message 1!").scrollIntoView();

		cy.receiveMessage("Message 21!");

		cy.contains("Message 21!").should("not.be.visible");
	});
});
