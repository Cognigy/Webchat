describe("Webchat Button", () => {
	it("should have correct aria-label for open webchat button", () => {
		cy.visitWebchat()
			.initMockWebchat()
			.get('[aria-label="Open chat"]')
			.click()
			.get('[aria-label="Open chat"]')
			.should("not.exist");
	});

	it("should have correct aria-label for open webchat button with one unread message", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					unreadMessages: {
						enablePreview: true,
						enableIndicator: true,
						enableBadge: true,
					},
					teaserMessage: {
						text: "engagement message text",
					},
				},
			})
			.wait(6000)
			.get('[aria-label="One unread message in chat. Open chat"]')
			.should("be.visible")
			.get('[aria-label="One unread message in chat. Open chat"]')
			.click()
			.get('[aria-label="One unread message in chat. Open chat"]')
			.should("not.exist");
	});

	it("should have correct aria-label for open webchat button with more than one unread message", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					enableUnreadMessagePreview: true,
				},
			})
			.withMessageFixture("text", () => {
				cy.withMessageFixture("audio", () => {
					cy.get('[aria-label="2 unread messages in chat. Open chat"]').should(
						"be.visible",
					);
				});
			});
	});

	it("should have correct aria-label for close webchat button", () => {
		cy.visitWebchat()
			.initMockWebchat()
			.get('[aria-label="Open chat"]')
			.click()
			.get('[aria-label="Close chat"]')
			.should("be.visible")
			.get('[aria-label="Close chat"]')
			.last()
			.click() // webchat toggle button
			.get('[aria-label="Close chat"]')
			.should("not.exist");
	});

	it("should have correct aria-label for close button in chat window homescreen", () => {
		cy.visitWebchat()
			.initMockWebchat()
			.get('[aria-label="Open chat"]')
			.click()
			.get('[aria-label="Close chat"]')
			.first()
			.click() // close button in chat window homescreen
			.get('[aria-label="Close chat"]')
			.should("not.exist");
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("closed chat toggle button has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat();
			cy.get('[aria-label="Open chat"]').should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
