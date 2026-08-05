describe("Rating", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	const chatOptionsTitle = "Menu";
	it("header button shouldn't show up by default", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "always",
					},
				},
			},
		})
			.openWebchat()
			.startConversation();
		cy.get(`[aria-label="${chatOptionsTitle}"]`).as("menuButton");

		cy.get("@menuButton").click();

		cy.contains("Please rate your chat experience").should("be.visible");
		cy.get('[data-test="rating-input"]').then($input => {
			const inputId = $input.attr("id");
			cy.get(`label[for="${inputId}"]`).should("have.text", "Type something here...");
		});
	});

	it("dialog should show up if requested", () => {
		cy.initMockWebchat();
		cy.openWebchat().startConversation();

		cy.receiveMessage(
			"",
			{
				_plugin: {
					type: "request-rating",
					data: {
						ratingTitleText: "rating title",
						ratingCommentText: "rating text",
					},
				},
			},
			"bot",
		);

		cy.contains("rating title").should("be.visible");
		cy.get('[data-test="rating-input"]').then($input => {
			const inputId = $input.attr("id");
			cy.get(`label[for="${inputId}"]`).should("have.text", "rating text");
		});
	});

	it("submits a positive rating on request", () => {
		cy.initMockWebchat();
		cy.openWebchat().startConversation();

		cy.receiveMessage(
			"",
			{
				_plugin: {
					type: "request-rating",
					data: {
						ratingTitleText: "rating title",
						ratingCommentText: "rating text",
					},
				},
			},
			"bot",
		);

		cy.get('[aria-label="Like"]').click();
		cy.get('[data-test="rating-input"]').type("I liked it");
		cy.get(".webchat-rating-widget-send-button").click();

		cy.get(".webchat-chat-history").contains("Feedback submitted");
	});

	it("submits a negative rating on request", () => {
		cy.initMockWebchat();
		cy.openWebchat().startConversation();

		cy.receiveMessage(
			"",
			{
				_plugin: {
					type: "request-rating",
					data: {
						ratingTitleText: "rating title",
						ratingCommentText: "rating text",
					},
				},
			},
			"bot",
		);

		cy.get('[aria-label="Dislike"]').click();
		cy.get('[data-test="rating-input"]').type("I didnt like it");
		cy.get(".webchat-rating-widget-send-button").click();

		cy.get(".webchat-chat-history").contains("Feedback submitted");
	});

	it("shows the rating button in the header if rating is set to always", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "always",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.get(`[aria-label="${chatOptionsTitle}"]`).should("be.visible");
	});

	it("shows a dialog with default texts when clicking the rating button", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "always",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.get(`[aria-label="${chatOptionsTitle}"]`).click();

		cy.contains("Please rate your chat experience").should("be.visible");
		cy.get('[data-test="rating-input"]').then($input => {
			const inputId = $input.attr("id");
			cy.get(`label[for="${inputId}"]`).should("have.text", "Type something here...");
		});
	});

	it("submits a rating after clicking the rating button", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "always",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.get(`[aria-label="${chatOptionsTitle}"]`).click();

		cy.get('[aria-label="Like"]').click();
		cy.get('[data-test="rating-input"]').type("I loved it");
		cy.get(".webchat-rating-widget-send-button").click();

		cy.get("#webchatStatusLiveRegion").contains("Your feedback was submitted");
	});

	it("shows the rating button in the header if rating is set to once", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "once",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.get(`[aria-label="${chatOptionsTitle}"]`).should("be.visible");
	});

	it("can't submit another rating when it was set to once", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					title: chatOptionsTitle,
					rating: {
						enabled: "once",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.get(`[aria-label="${chatOptionsTitle}"]`).click();

		cy.get('[aria-label="Like"]').click();
		cy.get('[data-test="rating-input"]').type("I loved it");
		cy.get(".webchat-rating-widget-send-button").click();

		cy.get("#webchatStatusLiveRegion").contains("Your feedback was submitted");

		cy.get('[data-test="rating-input"]').should("not.exist");
	});

	it("displays only rating widget when request rating arrives, hiding other chat options", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					quickReplyOptions: {
						enabled: true,
						quickReplies: [
							{
								type: "postback",
								title: "Quick Reply Test",
								payload: "quick-reply-test",
							},
						],
					},
					showTTSToggle: true,
					enableDeleteConversation: true,
					rating: {
						enabled: "always",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.receiveMessage(
			"",
			{
				_plugin: {
					type: "request-rating",
					data: {
						ratingTitleText: "How was your experience?",
						ratingCommentText: "Please share your thoughts",
					},
				},
			},
			"bot",
		);

		// Rating widget should be visible
		cy.get(".webchat-rating-widget-root").should("exist");

		// Other chat options should NOT be visible
		cy.get(".webchat-postback-buttons").should("not.exist");
		cy.get(".webchat-tts-option-root").should("not.exist");
		cy.get(".webchat-delete-conversation-container").should("not.exist");
	});

	it("overrides chat options config, when request rating arrives", () => {
		cy.initMockWebchat({
			settings: {
				chatOptions: {
					enabled: true,
					rating: {
						enabled: "always",
						title: "Feedback",
						commentPlaceholder: "Type something here...",
					},
				},
			},
		});
		cy.openWebchat().startConversation();

		cy.receiveMessage(
			"",
			{
				_plugin: {
					type: "request-rating",
					data: {
						ratingTitleText: "How was your experience?",
						ratingCommentText: "Please share your thoughts",
					},
				},
			},
			"bot",
		);

		// Request Rating node config should override chat options config
		cy.get(".webchat-rating-widget-root").should("exist");
		cy.contains("How was your experience?").should("be.visible");
		cy.get('[data-test="rating-input"]').then($input => {
			const inputId = $input.attr("id");
			cy.get(`label[for="${inputId}"]`).should("have.text", "Please share your thoughts");
		});
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("rating widget has no detectable a11y violations", () => {
			cy.initMockWebchat();
			cy.openWebchat().startConversation();
			cy.receiveMessage(
				"",
				{
					_plugin: {
						type: "request-rating",
						data: {
							ratingTitleText: "How was your experience?",
							ratingCommentText: "Please share your thoughts",
						},
					},
				},
				"bot",
			);
			cy.get(".webchat-rating-widget-root").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("announces the feedback-submitted status via a pre-existing live region (SC 4.1.3)", () => {
			cy.initMockWebchat({
				settings: {
					chatOptions: {
						enabled: true,
						title: chatOptionsTitle,
						rating: {
							enabled: "always",
						},
					},
				},
			});
			cy.openWebchat().startConversation();

			// The live region must exist in the DOM BEFORE the notification fires,
			// otherwise screen readers ignore the update (CGY-4035).
			cy.get("#webchatStatusLiveRegion")
				.should("exist")
				.and("have.attr", "aria-live", "polite")
				.and("be.empty");

			cy.get(`[aria-label="${chatOptionsTitle}"]`).click();
			cy.get('[aria-label="Like"]').click();
			cy.get(".webchat-rating-widget-send-button").click();

			cy.get("#webchatStatusLiveRegion").contains("Your feedback was submitted");

			// The visible toast must not announce itself as well (no double announcement).
			cy.get('[role="status"]')
				.not("#webchatStatusLiveRegion")
				.should($els => {
					$els.each((_, el) => {
						expect(el.getAttribute("aria-live")).to.equal("off");
					});
				});
		});

		it("moves focus to the screen title after submitting feedback from chat options (SC 2.4.3)", () => {
			// With rating "once" the widget unmounts on submit, which would
			// otherwise drop focus to document.body.
			cy.initMockWebchat({
				settings: {
					chatOptions: {
						enabled: true,
						title: chatOptionsTitle,
						rating: {
							enabled: "once",
						},
					},
				},
			});
			cy.openWebchat().startConversation();

			cy.get(`[aria-label="${chatOptionsTitle}"]`).click();
			cy.get('[aria-label="Like"]').click();
			cy.get(".webchat-rating-widget-send-button").click();

			cy.get(".webchat-header-bar .webchat-header-title").should("have.focus");
		});

		it("moves focus to the screen title after submitting feedback with rating 'always' (SC 2.4.3)", () => {
			// With rating "always" the widget stays but the focused Send button
			// becomes disabled, which would also drop focus to document.body.
			cy.initMockWebchat({
				settings: {
					chatOptions: {
						enabled: true,
						title: chatOptionsTitle,
						rating: {
							enabled: "always",
						},
					},
				},
			});
			cy.openWebchat().startConversation();

			cy.get(`[aria-label="${chatOptionsTitle}"]`).click();
			cy.get('[aria-label="Like"]').click();
			cy.get(".webchat-rating-widget-send-button").click();

			cy.get(".webchat-header-bar .webchat-header-title").should("have.focus");
		});

		it("status notification toast has no detectable a11y violations (incl. contrast)", () => {
			cy.initMockWebchat({
				settings: {
					chatOptions: {
						enabled: true,
						title: chatOptionsTitle,
						rating: {
							enabled: "always",
						},
					},
				},
			});
			cy.openWebchat().startConversation();

			cy.get(`[aria-label="${chatOptionsTitle}"]`).click();
			cy.get('[aria-label="Like"]').click();
			cy.get(".webchat-rating-widget-send-button").click();

			// Scan while the toast is visible so axe checks its text contrast.
			// Target the toast via its stable class — a bare cy.contains()
			// would match the sr-only live region, which is never "visible".
			cy.get(".webchat-toast-notification")
				.should("be.visible")
				.and("contain.text", "Your feedback was submitted");
			cy.get(".webchat-toast-notification [aria-live='off']").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("announces the newest notification when several land in the same tick (CGY-34519)", () => {
			// react-hot-toast prepends new toasts, so naive array order picks
			// the oldest one; regression test for the newest-wins fix.
			cy.initMockWebchat({});
			cy.openWebchat().startConversation();

			cy.getWebchat().then(webchat => {
				webchat.showNotification("first notification");
				webchat.showNotification("second notification");
			});

			cy.get("#webchatStatusLiveRegion").should("contain.text", "second notification");
			cy.get("#webchatStatusLiveRegion").should("not.contain.text", "first notification");
		});

		it("clears announced status text after 15 seconds (CGY-34519)", () => {
			cy.initMockWebchat({});
			cy.openWebchat().startConversation();

			// cy.clock() also freezes Date.now(), which react-hot-toast uses for
			// toast createdAt — so this test can't be merged with the
			// newest-notification-wins test above, which depends on real
			// createdAt ordering.
			cy.clock();

			cy.getWebchat().then(webchat => {
				webchat.showNotification("temporary status");
			});
			// Flush the toast store update into the region
			cy.tick(100);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "temporary status");

			// Past the 15s clear delay the region must be empty again, so
			// screen-reader users browsing later don't read stale status text.
			// This tick also fires the toast's own dismiss/remove timers; the
			// resulting store update only prunes announcedIdsRef in
			// StatusLiveRegion — it cannot re-set the cleared text.
			cy.tick(15100);
			cy.get("#webchatStatusLiveRegion").should("be.empty");
		});
	});
});
