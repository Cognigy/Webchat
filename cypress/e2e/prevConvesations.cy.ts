describe("Previous Conversations", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("is possible to navigate to empty conversation list from Home Screen", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					previousConversations: {
						enabled: true,
						buttonText: "View previous conversations",
					},
				},
			},
		});
		cy.openWebchat();
		cy.get("button").contains("View previous conversations").click();
		cy.get(".webchat-prev-conversations-content").should("exist");

		// it should be empty list
		cy.get(".webchat-prev-conversations-item").should("have.length", 0);
	});

	it("should list a new conversation", () => {
		cy.session("default1", () => {
			const localOptions = {
				userId: `user-1`,
				sessionId: `session-1`,
				channel: `channel-1`,
			};

			cy.window().then(window => {
				window.localStorage.clear();
			});

			cy.visitWebchat();
			cy.initWebchat(localOptions).openWebchat().startConversation();
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			// list contains 1 item
			cy.get("button.webchat-header-back-button").should("exist").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-item").should("have.length", 1);

			// check if conversation persists after page reload
			cy.reload();
			cy.initWebchat(localOptions).openWebchat();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-content").should("exist");
			cy.get(".webchat-prev-conversations-item").should("have.length", 1);
		});
	});

	it("should be possible to continue a previous conversation", () => {
		cy.session("default2", () => {
			const localOptions = {
				userId: `user-1`,
				sessionId: `session-1`,
				channel: `channel-1`,
			};

			cy.window().then(window => {
				window.localStorage.clear();
			});

			cy.visitWebchat();
			cy.initWebchat(localOptions).openWebchat().startConversation();
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			// list contains 1 item
			cy.get("button.webchat-header-back-button").should("exist").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-item").should("have.length", 1);

			// go to the first conversation
			cy.get(".webchat-prev-conversations-item").eq(0).click();

			cy.sendMessage("hello 2");
			cy.contains('You said "hello 2".').should("be.visible");
		});
	});

	it("should not be possible to continue expired previous conversation", () => {
		cy.session("default3", () => {
			const localOptions = {
				userId: `user-1`,
				sessionId: `session-1`,
				channel: `channel-1`,
			};

			const key = [
				"channel-1",
				"user-1",
				"session-1",
				"5e51fcdc2c10fe4c5267c8a798a7134086f60b62998062af620ed73b096e25bd",
			];

			cy.window().then(window => {
				window.localStorage.clear();
				cy.fixture("prevConversationsExpired.json").then(jsonData => {
					window.localStorage.setItem(JSON.stringify(key), JSON.stringify(jsonData));
				});
			});

			cy.visitWebchat();
			cy.initWebchat(localOptions).openWebchat();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-content").should("exist");
			cy.get(".webchat-prev-conversations-item").should("have.length", 1);

			// go to the first conversation
			cy.get(".webchat-prev-conversations-item").eq(0).click();

			cy.contains("Conversation ended").should("be.visible");
			cy.get(".webchat-input").should("not.exist");
		});
	});

	describe("Relative Time Display", () => {
		/**
		 * Helper function to set up a conversation with a specific timestamp in localStorage
		 * @param timestamp - Unix timestamp in milliseconds for the message
		 * @param sessionId - Unique session identifier for the conversation
		 * @returns Local options object containing userId, sessionId, and channel
		 */
		const setupConversationWithTimestamp = (timestamp: number, sessionId: string) => {
			const localOptions = {
				userId: `user-time-test`,
				sessionId: sessionId,
				channel: `channel-time-test`,
			};

			const key = [
				localOptions.channel,
				localOptions.userId,
				localOptions.sessionId,
				"5e51fcdc2c10fe4c5267c8a798a7134086f60b62998062af620ed73b096e25bd",
			];

			const conversationData = {
				messages: [
					{
						text: "test message",
						source: "user",
						timestamp: timestamp,
					},
					{
						text: "You said 'test message'.",
						data: {},
						traceId: "test-trace-id",
						disableSensitiveLogging: false,
						source: "bot",
						timestamp: timestamp,
					},
				],
				rating: {
					hasGivenRating: false,
					showRatingScreen: false,
					requestRatingScreenTitle: "",
					customRatingTitle: "",
					customRatingCommentText: "",
					requestRatingSubmitButtonText: "",
					requestRatingEventBannerText: "",
					requestRatingChatStatusBadgeText: "",
				},
			};

			cy.window().then(window => {
				window.localStorage.setItem(JSON.stringify(key), JSON.stringify(conversationData));
			});

			return localOptions;
		};

		beforeEach(() => {
			cy.window().then(window => {
				window.localStorage.clear();
			});
		});

		it("should display 'Today' for messages from today", () => {
			cy.session("time-today", () => {
				const now = Date.now();
				const localOptions = setupConversationWithTimestamp(now, "session-today");

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should("contain.text", "Today");
					});
			});
		});

		it("should display 'Yesterday' for messages from yesterday", () => {
			cy.session("time-yesterday", () => {
				const now = new Date();
				const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				const yesterdayMidnight = new Date(todayMidnight);
				yesterdayMidnight.setDate(todayMidnight.getDate() - 1);
				const yesterday = yesterdayMidnight.getTime();
				const localOptions = setupConversationWithTimestamp(yesterday, "session-yesterday");

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should(
							"contain.text",
							"Yesterday",
						);
					});
			});
		});

		it("should display '2 days ago' for messages from 2 days ago", () => {
			cy.session("time-2days", () => {
				const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
				const localOptions = setupConversationWithTimestamp(twoDaysAgo, "session-2days");

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should(
							"contain.text",
							"days ago",
						);
					});
			});
		});

		it("should display week-based time for messages from 2 weeks ago", () => {
			cy.session("time-2weeks", () => {
				const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
				const localOptions = setupConversationWithTimestamp(twoWeeksAgo, "session-2weeks");

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should("contain.text", "week");
					});
			});
		});

		it("should display month-based time for messages from 2 months ago", () => {
			cy.session("time-2months", () => {
				// Approximately 2 months ago (60 days)
				const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
				const localOptions = setupConversationWithTimestamp(
					twoMonthsAgo,
					"session-2months",
				);

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should("contain.text", "month");
					});
			});
		});

		it("should display year-based time for messages from over a year ago", () => {
			cy.session("time-1year", () => {
				// More than 1 year ago (400 days to ensure it's clearly over a year)
				const oneYearAgo = Date.now() - 400 * 24 * 60 * 60 * 1000;
				const localOptions = setupConversationWithTimestamp(oneYearAgo, "session-1year");

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 1);
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should("contain.text", "year");
					});
			});
		});

		it("should display multiple conversations with different timestamps in order", () => {
			cy.session("time-multiple", () => {
				const now = Date.now();
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				const yesterday = new Date(today);
				yesterday.setDate(today.getDate() - 1);
				const threeDaysAgo = new Date(today);
				threeDaysAgo.setDate(today.getDate() - 3);

				// Use timestamps for setupConversationWithTimestamp
				const yesterdayTs = yesterday.getTime();
				const threeDaysAgoTs = threeDaysAgo.getTime();

				setupConversationWithTimestamp(now, "session-multi-1");
				setupConversationWithTimestamp(yesterdayTs, "session-multi-2");
				setupConversationWithTimestamp(threeDaysAgoTs, "session-multi-3");

				const localOptions = {
					userId: `user-time-test`,
					sessionId: "session-multi-1", // Use any valid session
					channel: `channel-time-test`,
				};

				cy.visitWebchat();
				cy.initWebchat(localOptions).openWebchat();
				cy.get("button").contains("Previous conversations").click();
				cy.get(".webchat-prev-conversations-content").should("exist");
				cy.get(".webchat-prev-conversations-item").should("have.length", 3);

				// Most recent should be first (Today)
				cy.get(".webchat-prev-conversations-item")
					.first()
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should("contain.text", "Today");
					});

				// Second should be yesterday
				cy.get(".webchat-prev-conversations-item")
					.eq(1)
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should(
							"contain.text",
							"Yesterday",
						);
					});

				// Third should be days ago
				cy.get(".webchat-prev-conversations-item")
					.eq(2)
					.within(() => {
						cy.get(".webchat-prev-conversations-time").should(
							"contain.text",
							"days ago",
						);
					});
			});
		});

		describe("Boundary conditions", () => {
			it("should display correct format for 3 weeks ago", () => {
				cy.session("time-3weeks", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const threeWeeksAgo = new Date(today);
					threeWeeksAgo.setDate(today.getDate() - 21);
					const localOptions = setupConversationWithTimestamp(
						threeWeeksAgo.getTime(),
						"session-3weeks",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"week",
							);
						});
				});
			});

			it("should display correct format for 4 weeks ago", () => {
				cy.session("time-4weeks", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const fourWeeksAgo = new Date(today);
					fourWeeksAgo.setDate(today.getDate() - 28);
					const localOptions = setupConversationWithTimestamp(
						fourWeeksAgo.getTime(),
						"session-4weeks",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"week",
							);
						});
				});
			});

			it("should display correct format for 5 weeks ago (boundary to months)", () => {
				cy.session("time-5weeks", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const fiveWeeksAgo = new Date(today);
					fiveWeeksAgo.setDate(today.getDate() - 35);
					const localOptions = setupConversationWithTimestamp(
						fiveWeeksAgo.getTime(),
						"session-5weeks",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should display as month-based time since it's > 31 days
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"month",
							);
						});
				});
			});

			it("should display correct format for 29 days ago", () => {
				cy.session("time-29days", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const twentyNineDaysAgo = new Date(today);
					twentyNineDaysAgo.setDate(today.getDate() - 29);
					const localOptions = setupConversationWithTimestamp(
						twentyNineDaysAgo.getTime(),
						"session-29days",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should still display as weeks since daysDiff < 31
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"week",
							);
						});
				});
			});

			it("should display correct format for 30 days ago", () => {
				cy.session("time-30days", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const thirtyDaysAgo = new Date(today);
					thirtyDaysAgo.setDate(today.getDate() - 30);
					const localOptions = setupConversationWithTimestamp(
						thirtyDaysAgo.getTime(),
						"session-30days",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should still display as weeks since daysDiff < 31
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"week",
							);
						});
				});
			});

			it("should display correct format for 31 days ago (boundary to months)", () => {
				cy.session("time-31days", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const thirtyOneDaysAgo = new Date(today);
					thirtyOneDaysAgo.setDate(today.getDate() - 31);
					const localOptions = setupConversationWithTimestamp(
						thirtyOneDaysAgo.getTime(),
						"session-31days",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should display as month-based time since daysDiff >= 31
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"month",
							);
						});
				});
			});

			it("should display correct format for 11 months ago", () => {
				cy.session("time-11months", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const elevenMonthsAgo = new Date(today);
					elevenMonthsAgo.setMonth(today.getMonth() - 11);
					const localOptions = setupConversationWithTimestamp(
						elevenMonthsAgo.getTime(),
						"session-11months",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should display as months since it's < 12 months
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"month",
							);
						});
				});
			});

			it("should display correct format for 12 months ago (boundary to years)", () => {
				cy.session("time-12months", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const twelveMonthsAgo = new Date(today);
					twelveMonthsAgo.setMonth(today.getMonth() - 12);
					const localOptions = setupConversationWithTimestamp(
						twelveMonthsAgo.getTime(),
						"session-12months",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should display as years since monthsDiff >= 12
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"year",
							);
						});
				});
			});

			it("should display correct format for 13 months ago", () => {
				cy.session("time-13months", () => {
					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const thirteenMonthsAgo = new Date(today);
					thirteenMonthsAgo.setMonth(today.getMonth() - 13);
					const localOptions = setupConversationWithTimestamp(
						thirteenMonthsAgo.getTime(),
						"session-13months",
					);

					cy.visitWebchat();
					cy.initWebchat(localOptions).openWebchat();
					cy.get("button").contains("Previous conversations").click();
					cy.get(".webchat-prev-conversations-content").should("exist");
					cy.get(".webchat-prev-conversations-item").should("have.length", 1);
					cy.get(".webchat-prev-conversations-item")
						.first()
						.within(() => {
							// Should display as years since monthsDiff >= 12
							cy.get(".webchat-prev-conversations-time").should(
								"contain.text",
								"year",
							);
						});
				});
			});
		});
	});
});
