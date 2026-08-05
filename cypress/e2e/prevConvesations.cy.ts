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

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		// Not wrapped in cy.session: on a retry a restored session would skip
		// the callback — and every assertion in it — turning the test into a no-op.
		it("includes the visible preview text in the conversation item accessible name (CGY-3275)", () => {
			const localOptions = {
				userId: `user-1`,
				sessionId: `session-1`,
				channel: `channel-1`,
			};

			// No manual localStorage.clear() here: before cy.visitWebchat() the
			// window still belongs to the previous test's page, and Cypress test
			// isolation already clears storage between tests.
			cy.visitWebchat();
			cy.initWebchat(localOptions).openWebchat().startConversation();
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			cy.get("button.webchat-header-back-button").should("exist").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-item")
				.should("have.length", 1)
				.first()
				.invoke("attr", "aria-label")
				.should(ariaLabel => {
					// 2.5.3 best practice: the name starts with the visible preview text
					expect(ariaLabel).to.match(/^You said "hello"\./);
					expect(ariaLabel).to.contain("Today");
					expect(ariaLabel).to.contain("Open conversation 1");
				});

			// Long previews are capped in the accessible name (still a superset
			// of the visible, CSS-truncated text)
			cy.get(".webchat-prev-conversations-item").first().click();
			cy.sendMessage("word ".repeat(30).trim());
			cy.contains('You said "word').should("be.visible");

			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-item")
				.first()
				.invoke("attr", "aria-label")
				.should(ariaLabel => {
					expect(ariaLabel).to.be.a("string");
					// Capture the capped preview up to the ellipsis instead of
					// splitting on ", ", which any preview containing ", "
					// would break
					const previewPart = String(ariaLabel).match(/^You said "word[^…]*…/)?.[0];
					expect(previewPart, "capped preview ending in …").to.be.a("string");
					expect(previewPart?.length).to.be.at.most(81);
				});
		});

		it("hides the leaving screen from assistive tech during the back-to-home transition (CGY-3276)", () => {
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

			// While active, the regular layout content is fully exposed: no
			// aria-hidden (the "false" value has inconsistent AT support) and
			// not inert. `not.have.attr` assertions come last in their chains —
			// they re-subject the chain to the (non-existent) attribute value.
			cy.get(".webchat-regular-layout-content").should("not.have.attr", "inert");
			cy.get(".webchat-regular-layout-content").should("not.have.attr", "aria-hidden");

			// Freeze the app clock so the 500ms exit window is deterministic —
			// without it, the first assertion below can land after the unmount
			// and fail as "element not found" instead of meaningfully.
			cy.clock();
			cy.get("button.webchat-header-back-button").click();

			// During the slide-out the leaving screen must be removed from the
			// accessibility tree and tab order (inert + aria-hidden fallback)
			// and stay frozen on the previous-conversations view — mounting the
			// chat screen there would autofocus the input and re-announce the
			// message history. Afterwards it unmounts entirely.
			cy.get(".webchat-regular-layout-content").should($el => {
				expect($el.attr("aria-hidden")).to.equal("true");
				expect($el.is("[inert]"), "inert during exit").to.equal(true);
				expect($el.find(".webchat-prev-conversations-root").length).to.be.greaterThan(0);
				expect($el.find(".webchat-input, textarea").length).to.equal(0);
			});

			// Past the 500ms exit, the 450ms focus timeout and the 600ms
			// home-screen announcement delay
			cy.tick(700);
			cy.get(".webchat-regular-layout-content").should("not.exist");

			// After the transition, focus lands on the home screen close button
			// and the screen change is announced via the status live region
			cy.get(".webchat-homescreen-close-button").should("have.focus");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "Chat window home screen");
		});

		it("previous conversations list has no detectable a11y violations", () => {
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
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
