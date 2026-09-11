// Unread-message count screen-reader announcement (WCAG 4.1.3 Status Messages, CGY-3163).
// The badge and the page-title indicator only reach sighted users; the count announces
// through the always-mounted #webchatUnreadMessagesLiveRegion (role="status").
describe("Unread Messages Announcement", () => {
	const regionSelector = "#webchatUnreadMessagesLiveRegion";

	it("mounts the live region empty before any unread message arrives", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: true },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.get(regionSelector)
			.should("have.attr", "role", "status")
			.and("have.attr", "aria-live", "polite")
			.and("be.empty");
	});

	it("announces the count with the badge enabled and again when it grows", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: true },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		cy.get(regionSelector).should("have.text", "One unread message in chat.");

		cy.receiveMessage("second bot message");
		cy.get(regionSelector).should("have.text", "2 unread messages in chat.");
	});

	it("announces the count with only the page-title indicator enabled", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableIndicator: true },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		cy.get(regionSelector).should("have.text", "One unread message in chat.");
	});

	it("stays silent when neither badge nor title indicator is enabled", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: false, enableIndicator: false },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		// The count still reaches the toggle button's name (read on focus) …
		cy.get('[aria-label="One unread message in chat. Open chat"]').should("be.visible");
		// … but nothing is pushed through the live region.
		cy.get(regionSelector).should("be.empty");
	});

	it("uses the configured singular and plural aria labels", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: true },
				customTranslations: {
					ariaLabels: {
						unreadMessageSingularText: "Eine ungelesene Nachricht",
						unreadMessagePluralText: "ungelesene Nachrichten",
					},
				},
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		cy.get(regionSelector).should("have.text", "Eine ungelesene Nachricht");

		cy.receiveMessage("second bot message");
		cy.get(regionSelector).should("have.text", "2 ungelesene Nachrichten");
	});

	it("clears the announcement silently once the chat history is shown", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: true },
				// Unseen messages are cleared when the chat HISTORY becomes
				// visible, not on open alone (the home screen keeps the badge).
				homeScreen: { enabled: false },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		cy.get(regionSelector).should("have.text", "One unread message in chat.");
		cy.get(".webchat-unread-message-badge").should("be.visible");

		cy.get("[data-cognigy-webchat-toggle]").click();
		cy.get(".webchat-chat-history").should("be.visible");
		cy.get(".webchat-unread-message-badge").should("not.exist");
		cy.get(regionSelector).should("be.empty");
	});

	it("announces with the toggle button disabled (title indicator only)", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableIndicator: true },
				widgetSettings: { disableToggleButton: true },
			},
		});

		// The region is mounted outside the toggle-button block: the title
		// indicator runs without a toggle button, so the announcement must too.
		cy.get(regionSelector).should("exist").and("be.empty");
		cy.get("[data-cognigy-webchat-toggle]").should("not.exist");
		cy.receiveMessage("first bot message");
		cy.get(regionSelector).should("have.text", "One unread message in chat.");
	});

	it("announces alongside the teaser preview when both are enabled", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: { enableBadge: true, enablePreview: true },
			},
		});

		cy.get('[aria-label="Open chat"]').should("be.visible");
		cy.receiveMessage("first bot message");
		cy.get("#webchatTeaserMessageLiveRegion").should(
			"contain.text",
			"New message preview: first bot message",
		);
		cy.get(regionSelector).should("have.text", "One unread message in chat.");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("closed webchat with an announced unread badge has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					unreadMessages: { enableBadge: true },
				},
			});

			cy.get('[aria-label="Open chat"]').should("be.visible");
			cy.receiveMessage("first bot message");
			// Run axe only once the badge is rendered and the announcement is committed.
			cy.get(".webchat-unread-message-badge").should("be.visible");
			cy.get(regionSelector).should("have.text", "One unread message in chat.");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
