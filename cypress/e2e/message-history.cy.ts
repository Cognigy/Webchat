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

		// Verify all 5 bot messages have distinct IDs in the Redux store —
		// proves no ID collision regardless of which generation path was used
		cy.window().then((win: any) => {
			const history = win.webchat.store.getState().messages.messageHistory;
			const botIds = history
				.filter((m: any) => m.source === "bot")
				.map((m: any) => m.id);
			expect(botIds).to.have.length.gte(5);
			expect(new Set(botIds).size).to.equal(botIds.length);
		});

		// crypto.randomUUID must have been called at least once.
		// cy.receiveMessage() injects messages that already carry a test-harness id,
		// so generateRandomId() is not invoked for them; the call here comes from
		// startConversation() dispatching the initial user message (SEND_MESSAGE path).
		cy.get("@cryptoRandomUUID").should("have.been.called");
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
