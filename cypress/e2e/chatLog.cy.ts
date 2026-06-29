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

	it("chat log region does not contain branding", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("not.contain", "Powered by");
	});

	it("chat log wrapper contains branding", () => {
		cy.get(".webchat-chat-history").get("#cognigyBrandingLink").should("exist");
	});

	it("parent has outline when chat log is focused", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").focus();
		cy.get(".webchat-chat-history").should("have.css", "outline", "rgb(59, 103, 233) auto 2px");
	});

	it("chat log panel has region role", () => {
		cy.get("#webchatChatHistoryWrapperLiveLogPanel").should("have.attr", "role", "region");
	});

	// AB#105695 — On Safari/WebKit, focusing an element during (reverse) keyboard navigation made
	// the browser scroll the `overflow: hidden` #webchatWindow shell to bring it into view, leaving
	// a stuck offset that shifted the header up and broke the layout. The window must never hold a
	// scroll offset — its onScroll handler snaps it back to the origin. We can't reproduce WebKit's
	// focus-scroll quirk in headless Chrome, so we assert the guarantee directly: any scroll of the
	// window is reset to 0.
	it("keeps the webchat window pinned to its scroll origin", () => {
		cy.withMessageFixture("adaptivecard", () => {
			// Simulate what WebKit's scroll-into-view does to the window.
			cy.get("#webchatWindow").then($win => {
				const win = $win[0];
				win.scrollTop = 80;
				win.dispatchEvent(new Event("scroll", { bubbles: false }));
			});
			cy.get("#webchatWindow").should($win => {
				expect($win[0].scrollTop).to.equal(0);
			});
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("has no detectable a11y violations when the log is scrollable and focused", () => {
			cy.withMessageFixture("adaptivecard", () => {
				cy.get("#webchatChatHistoryWrapperLiveLogPanel").focus();
				cy.checkA11yCompliance("[data-cognigy-webchat-root]");
			});
		});
	});
});
