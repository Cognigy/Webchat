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

		cy.get('[aria-live="polite"]').contains("Your feedback was submitted");
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

		cy.get('[aria-live="polite"]').contains("Your feedback was submitted");

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
});
