describe("Screen Reader Live Region", () => {
	const liveRegionSelector = "#webchatMessageContainerScreenReaderLiveRegion";

	beforeEach(() => {
		cy.visitWebchat();
		cy.initMockWebchat();
		cy.openWebchat().startConversation();
	});

	it("announces a rendered text message", () => {
		cy.receiveMessage("Hello there");

		// Wait past the 100ms debounce in ScreenReaderLiveRegion.
		cy.wait(500);
		cy.get(liveRegionSelector).should("contain", "Hello there");
	});

	it("does not announce a data-only message that is not rendered in the chat log", () => {
		// A message with no text and a payload that matches no renderable plugin
		// is data-only: it produces no <article> in the DOM.
		cy.receiveMessage("", { some: "data-only-payload" }, "bot");

		cy.wait(500);

		// The data-only message produces no rendered message node...
		cy.get("article").should("have.length", 0);
		// ...and must NOT be announced with the generic fallback.
		cy.get(liveRegionSelector).should("not.contain", "A new message");
	});

	it("skips a data-only message but still announces a later rendered message", () => {
		// Interleave a data-only message between two real text messages. This
		// guards the index-0 blocking edge case: a non-rendered message at the
		// front of the queue must not block announcement of later messages.
		cy.receiveMessage("First message");
		cy.wait(500);
		cy.get(liveRegionSelector).should("contain", "First message");

		cy.receiveMessage("", { some: "data-only-payload" }, "bot");
		cy.receiveMessage("Second message");

		cy.wait(500);

		// Only the two text messages render in the chat log.
		cy.get("article").should("have.length", 2);
		// The later text message is still announced...
		cy.get(liveRegionSelector).should("contain", "Second message");
		// ...and the data-only message never triggered the generic fallback.
		cy.get(liveRegionSelector).should("not.contain", "A new message");
	});
});
