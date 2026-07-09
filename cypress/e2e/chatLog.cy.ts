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
	// scroll offset — its onScroll handler snaps it back to the origin.
	//
	// We can't reproduce WebKit's focus-scroll quirk in headless Chrome, and the window can't
	// actually hold an offset here (its inner chat log absorbs all overflow, so scrollHeight ===
	// clientHeight and the browser clamps any scrollTop straight back to 0). So we exercise the
	// wired-up handler directly: make the node *report* a non-zero scrollTop, fire the same native
	// `scroll` event WebKit would, and assert the handler resets it. This fails if the onScroll
	// handler is removed or stops clamping — unlike a plain `scrollTop = 80` assignment, which the
	// browser clamps to 0 before the handler ever runs (so it would pass even with no fix).
	it("keeps the webchat window pinned to its scroll origin", () => {
		cy.withMessageFixture("adaptivecard", () => {
			// Precondition: the window genuinely can't scroll here — assigning an offset is clamped
			// to 0 immediately, which is why a naive assignment can't drive this test.
			cy.get("#webchatWindow").then($win => {
				const win = $win[0];
				win.scrollTop = 80;
				expect(win.scrollTop, "window cannot hold a scroll offset").to.equal(0);
			});

			// Stub scrollTop so the node reports the offset WebKit's scroll-into-view would leave,
			// then fire the real native `scroll` event the handler listens for. React 18 attaches
			// onScroll as a native listener on this node, so the actual handler runs.
			cy.get("#webchatWindow").then($win => {
				const win = $win[0];
				let reported = 69; // observed WebKit nudge
				Object.defineProperty(win, "scrollTop", {
					configurable: true,
					get: () => reported,
					set: v => {
						reported = v;
					},
				});
				win.dispatchEvent(new Event("scroll", { bubbles: false }));

				expect(reported, "onScroll handler snaps the window back to origin").to.equal(0);
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
