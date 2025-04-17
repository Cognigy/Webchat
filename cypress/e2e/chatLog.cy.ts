describe("Chat Log", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("is chat log region non-focusable when no messages in log", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("have.attr", "tabindex", -1);
	});

	it("is chat log region focusable when the log is scrollable", () => {
		cy.withMessageFixture("adaptivecard", () => {
			cy.get("#webchatChatHistoryWrapperLiveLogPanel").focus();
			cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("have.attr", "tabindex", 0);
		});
	});

	it("is chat log region accessible", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("have.attr", "role", "log");
	});

	it("chat log region does not contain branding", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("not.contain", "Powered by");
	});

	it("chat log wrapper contains branding", () => {
		cy.get(".webchat-chat-history").get("#cognigyBrandingLink").should("exist");
	});

	it("parent has outline when chat log is focused", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").focus();
		cy.get(".webchat-chat-history").should("have.css", "outline", "rgb(81, 119, 236) auto 1px");
	});
});
