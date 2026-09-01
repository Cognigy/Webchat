// Teaser message screen-reader announcement (WCAG 4.1.3 Status Messages, CGY-3270).
// The teaser shows while the chat window is closed, so it announces through the
// always-mounted #webchatTeaserMessageLiveRegion — never via aria-live on the
// bubble itself (a live region mounted together with its content is silent).
describe("Teaser Message Announcement", () => {
	const regionSelector = "#webchatTeaserMessageLiveRegion";

	it("mounts the live region empty before any teaser appears", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				teaserMessage: {
					text: "engagement message text",
					teaserMessageDelay: 1000,
				},
				unreadMessages: {
					enablePreview: false,
				},
			},
		});

		// The region must pre-exist the teaser in the accessibility tree,
		// politely (role="status", not role="alert").
		cy.get(regionSelector)
			.should("have.attr", "role", "status")
			.and("have.attr", "aria-live", "polite")
			.and("be.empty");
	});

	it("announces the engagement teaser message when it appears", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				teaserMessage: {
					text: "engagement message text",
					teaserMessageDelay: 1,
				},
				unreadMessages: {
					enablePreview: false,
				},
			},
		});

		cy.contains("engagement message text", { timeout: 500 }).should("be.visible");
		cy.get(regionSelector).should(
			"contain.text",
			"New message preview: engagement message text",
		);
	});

	it("does not carry aria-live on the teaser bubble (announcement is single-sourced)", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				teaserMessage: {
					text: "engagement message text",
					teaserMessageDelay: 1,
				},
				unreadMessages: {
					enablePreview: false,
				},
			},
		});

		cy.get(".webchat-teaser-message-bubble")
			.should("be.visible")
			.and("not.have.attr", "aria-live");
	});

	it("announces the unread-message preview teaser and again when the preview updates", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				unreadMessages: {
					enablePreview: true,
				},
			},
		});

		cy.receiveMessage("first bot message");
		cy.get(".webchat-teaser-message-bubble").should("be.visible");
		cy.get(regionSelector).should("contain.text", "New message preview: first bot message");

		cy.receiveMessage("second bot message");
		cy.get(regionSelector).should("contain.text", "New message preview: second bot message");
	});

	it("uses the configured newMessagePreview aria label", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				teaserMessage: {
					text: "engagement message text",
					teaserMessageDelay: 1,
				},
				unreadMessages: {
					enablePreview: false,
				},
				customTranslations: {
					ariaLabels: {
						newMessagePreview: "Neue Nachricht",
					},
				},
			},
		});

		cy.get(regionSelector).should("contain.text", "Neue Nachricht: engagement message text");
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("closed webchat with a visible, announced teaser has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					teaserMessage: {
						text: "engagement message text",
						teaserMessageDelay: 1,
					},
					unreadMessages: {
						enablePreview: false,
					},
				},
			});

			// Run axe only after the announcement is committed, so it sees the
			// populated live region too.
			cy.get(".webchat-teaser-message-bubble").should("be.visible");
			cy.get(regionSelector).should("contain.text", "engagement message text");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});

	it("clears the announcement silently when the teaser is dismissed", () => {
		cy.visitWebchat().initMockWebchat({
			settings: {
				teaserMessage: {
					text: "engagement message text",
					teaserMessageDelay: 1,
				},
				unreadMessages: {
					enablePreview: false,
				},
			},
		});

		cy.get(regionSelector).should("contain.text", "engagement message text");
		cy.get(".webchat-teaser-message-header-close-button").click();
		cy.get(regionSelector).should("not.contain.text", "engagement message text");
	});
});
