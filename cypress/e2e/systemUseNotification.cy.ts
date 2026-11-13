// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

/**
 * End-to-end tests for the System Use Notification (SUN) feature.
 * AC-8 / FedRAMP — WCH-AC8-001 / CSA-97598.
 *
 * The SUN is a pre-session acceptance gate shown before every new conversation.
 * It is separate from the GDPR PrivacyNotice: different config section, different
 * persistence (per sessionId not per userId), and different customer segment.
 */
describe("System Use Notification (WCH-AC8-001)", () => {
	const sunSettings = {
		systemUseNotification: {
			enabled: true,
			title: "System Use Notification",
			text: "You are accessing a U.S. Government information system.",
			submitButtonText: "I acknowledge and accept",
		},
	};

	describe("Rendering", () => {
		it("shows the SUN screen when systemUseNotification.enabled is true", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		it("does NOT show the SUN screen when systemUseNotification.enabled is false", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: false,
						title: "",
						text: "",
						submitButtonText: "",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("allows title customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "Custom SUN Title 456",
						text: "Notice text",
						submitButtonText: "Accept",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-header-title").should("have.text", "Custom SUN Title 456");
		});

		it("allows notice text customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "SUN",
						text: "Custom SUN text content 789",
						submitButtonText: "Accept",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-message").should(
				"contain.text",
				"Custom SUN text content 789",
			);
		});

		it("allows accept button text customization", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					systemUseNotification: {
						enabled: true,
						title: "SUN",
						text: "Notice",
						submitButtonText: "Custom Accept Label",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").should(
				"have.text",
				"Custom Accept Label",
			);
		});
	});

	describe("Accept flow", () => {
		it("dismisses the SUN screen after the user clicks accept", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("shows the chat history after accepting (socket connects)", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
		});

		it("blocks user messages until the SUN is accepted", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			// SUN is visible — no chat history yet
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get("#webchatChatHistory").should("not.exist");
		});
	});

	describe("Per-session gating", () => {
		it("shows the SUN again after a page reload, even for the same session", () => {
			const options = { sessionId: "session-reload", settings: sunSettings };
			cy.visitWebchat().initMockWebchat(options).openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");

			// Acceptance lives in page memory only: a reload asks again
			cy.reload();
			cy.initMockWebchat(options).openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});
	});

	describe("Ordering with PrivacyNotice", () => {
		it("shows SUN before the PrivacyNotice when both are enabled", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					privacyNotice: {
						enabled: true,
						title: "Privacy notice",
						text: "GDPR text",
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();
			// SUN must appear first
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-privacy-notice-root").should("not.exist");

			// After accepting SUN, PrivacyNotice should appear
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
			cy.get(".webchat-privacy-notice-root").should("be.visible");
		});
	});

	describe("Session switch", () => {
		it("shows SUN again after switchSession and defers socket switch until acceptance", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();

			// Accept SUN for the first session and use it, so it is a real conversation.
			// An accepted session without user messages carries its acceptance over to
			// the next session instead (covered under "Previous Conversations interaction").
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			// The harness exposes the Webchat instance as window.webchat (commands.ts).
			cy.window()
				.its("webchat.client.socketOptions.sessionId")
				.then(firstSessionId => {
					// Start a new conversation (triggers SWITCH_SESSION internally)
					// while SUN is already accepted for the current session.
					cy.window().then(win => {
						(win as any).webchat.endSession();
					});

					// SUN must appear again for the new session
					cy.get(".webchat-system-use-notification-root").should("be.visible");

					// The socket must not have switched yet: the switch is held as pending
					// and the client is still on the first session. Asserting on the UI
					// alone is not enough, as the SUN screen hides the chat history
					// regardless of the socket state.
					cy.window()
						.its("webchat.store")
						.invoke("getState")
						.its("ui.pendingSessionSwitch")
						.should("not.be.null");
					cy.window()
						.its("webchat.client.socketOptions.sessionId")
						.should("equal", firstSessionId);

					// Accept SUN for the new session — socket switch completes, chat resumes
					cy.get(".webchat-system-use-notification-accept-button").click();
					cy.get("#webchatChatHistory").should("exist");
					cy.window()
						.its("webchat.store")
						.invoke("getState")
						.its("ui.pendingSessionSwitch")
						.should("be.null");
					cy.window()
						.its("webchat.client.socketOptions.sessionId")
						.should("not.equal", firstSessionId);
				});
		});
	});

	describe("Previous Conversations interaction", () => {
		const prevConvSettings = {
			...sunSettings,
			homeScreen: {
				enabled: true,
				previousConversations: {
					enabled: true,
					buttonText: "Previous conversations",
					enableDeleteAllConversations: true,
				},
			},
		};

		it("does not show the delete-all-conversations button while SUN is pending", () => {
			// The delete-all button in the header must be hidden whenever SUN has not yet
			// been accepted — regardless of whether the previous-conversations screen is
			// active — so the user cannot delete history while the access gate is pending.
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			// SUN is showing — delete-all must be absent
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-header-delete-all-conversations-button").should("not.exist");

			// After acceptance, the button may appear once there are conversations
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-system-use-notification-root").should("not.exist");
		});

		it("re-hides the delete-all button after switchSession resets SUN acceptance", () => {
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			// Accept SUN for the first session and send a message in it
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			// Start a new conversation (SWITCH_SESSION resets hasAcceptedSystemUseNotification)
			cy.window().then(win => {
				(win as any).webchat.endSession();
			});

			// SUN reappears — delete-all must be hidden again
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-header-delete-all-conversations-button").should("not.exist");
		});

		it("shows SUN once when accepted on Previous conversations and then starting a new conversation (CGY-45543)", () => {
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();

			// The gate stays in front of Previous conversations
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get(".webchat-prev-conversations-content").should("exist");

			// Browsing the list must not open the chat screen, which would connect and fire
			// getStarted on the initial session. The mock socket never really connects, so
			// check the chat-screen flag rather than client.connected.
			cy.window()
				.its("webchat.store")
				.invoke("getState")
				.its("autoInject.isChatOpenedOnce")
				.should("equal", false);

			cy.window()
				.its("webchat.client.socketOptions.sessionId")
				.then(initialSessionId => {
					// Starting a new conversation must not ask again: the accepted session was never used
					cy.get(".webchat-prev-conversations-send-button").click();
					cy.get(".webchat-system-use-notification-root").should("not.exist");
					cy.get("#webchatChatHistory").should("exist");
					cy.window()
						.its("webchat.store")
						.invoke("getState")
						.its("ui")
						.should(ui => {
							expect(ui.hasAcceptedSystemUseNotification).to.equal(true);
							expect(ui.pendingSessionSwitch).to.equal(null);
						});
					// The deferred session switch completed: the socket moved to a new session
					cy.window()
						.its("webchat.client.socketOptions.sessionId")
						.should("not.equal", initialSessionId);
				});
		});

		it("still shows SUN for a new conversation after the user sent a message in the accepted one", () => {
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-send-button").click();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		it("sends a conversation starter on the new session, not the old one, after SUN acceptance", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...prevConvSettings,
					homeScreen: {
						...prevConvSettings.homeScreen,
						conversationStarters: {
							enabled: true,
							starters: [
								{
									type: "postback",
									title: "Postback starter",
									payload: "postback-payload",
								},
							],
						},
					},
				},
			});
			cy.openWebchat();
			cy.startConversation();

			// Accept SUN and use the session, so the next conversation needs a new acceptance
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			cy.window()
				.its("webchat.client.socketOptions.sessionId")
				.then(firstSessionId => {
					// Record which socket session every outgoing payload is sent on.
					const sent: { text: string; sessionId: string }[] = [];
					cy.window().then(win => {
						const client = (win as any).webchat.client;
						cy.stub(client, "sendMessage").callsFake((text: string) => {
							sent.push({ text, sessionId: client.socketOptions.sessionId });
						});
						// The mock socket never connects, so the real switchSession() never
						// resolves. Resolve it like a successful reconnect to the new session.
						cy.stub(client, "switchSession").callsFake((sessionId?: string) => {
							client.socketOptions.sessionId = sessionId || "session-starter-test";
							return Promise.resolve(client);
						});
					});

					cy.get("button.webchat-header-back-button").click();
					cy.contains("button", "Postback starter").click();

					// SUN gates the new conversation; the starter is queued, not sent on the
					// old session
					cy.get(".webchat-system-use-notification-root").should("be.visible");
					cy.window()
						.its("webchat.store")
						.invoke("getState")
						.its("ui.storedMessage.text")
						.should("equal", "postback-payload");
					cy.wrap(sent).should("have.length", 0);
					cy.window()
						.its("webchat.client.socketOptions.sessionId")
						.should("equal", firstSessionId);

					// After acceptance the socket switches and the starter is sent there, once
					cy.get(".webchat-system-use-notification-accept-button").click();
					cy.wrap(sent).should(calls => {
						expect(calls).to.have.length(1);
						expect(calls[0].text).to.equal("postback-payload");
						expect(calls[0].sessionId).to.not.equal(firstSessionId);
					});
					cy.window()
						.its("webchat.store")
						.invoke("getState")
						.should(state => {
							expect(state.ui.storedMessage).to.equal(null);
						});
				});
		});

		it("shows SUN again after deleting a conversation the user chatted in", () => {
			cy.visitWebchat().initMockWebchat({ settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();

			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			// Delete All and Delete conversation clear the messages before switching to a new
			// session. The cleared history must not make the used acceptance carry over.
			cy.window().then(win => {
				const { store } = (win as any).webchat;
				store.dispatch({ type: "CLEAR_MESSAGES" });
				store.dispatch({ type: "SWITCH_SESSION", sessionId: "session-after-delete" });
			});

			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.window()
				.its("webchat.store")
				.invoke("getState")
				.its("ui.hasAcceptedSystemUseNotification")
				.should("equal", false);
		});

		it("shows the list, not the notice, after Delete conversation; asks again on the next conversation (CGY-48501)", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...prevConvSettings,
					chatOptions: { enabled: true, enableDeleteConversation: true },
				},
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.sendMessage("hello");

			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-delete-conversation-button").click();
			cy.get(".webchat-delete-confirmation-confirm-button").click();

			// The user lands on Previous conversations; the list isn't covered by the notice
			cy.get(".webchat-prev-conversations-content").should("exist");
			cy.get(".webchat-system-use-notification-root").should("not.exist");

			// The next conversation still needs a new acceptance
			cy.get(".webchat-prev-conversations-send-button").click();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		it("keeps the empty list visible after Delete all; asks again on the next conversation (CGY-48501)", () => {
			const localOptions = {
				userId: "user-sun-delete-all",
				sessionId: "session-sun-delete-all-1",
				channel: "channel-sun-delete-all",
			};
			// Same key layout as getOptionsKey; "fake-url-token" is the mocked endpoint's URLToken
			const seedConversation = (sessionId: string) => {
				const key = ["webchat-client", localOptions.userId, sessionId, "fake-url-token"];
				const conversation = {
					messages: [{ text: "seeded message", source: "user", timestamp: Date.now() }],
				};
				cy.window().then(win => {
					win.localStorage.setItem(JSON.stringify(key), JSON.stringify(conversation));
				});
			};

			cy.visitWebchat();
			seedConversation("session-sun-delete-all-2");
			seedConversation("session-sun-delete-all-3");
			cy.initMockWebchat({ ...localOptions, settings: prevConvSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.sendMessage("hello");

			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-item").should("have.length.at.least", 2);

			cy.get(".webchat-header-delete-all-conversations-button").click();
			cy.get(".webchat-delete-confirmation-confirm-button").click();

			// The emptied list stays visible; no notice over it
			cy.get(".webchat-prev-conversations-empty").should("exist");
			cy.get(".webchat-system-use-notification-root").should("not.exist");

			cy.get(".webchat-prev-conversations-send-button").click();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		describe("an abandoned conversation starter is not sent", () => {
			const starterSettings = {
				...prevConvSettings,
				homeScreen: {
					...prevConvSettings.homeScreen,
					conversationStarters: {
						enabled: true,
						starters: [
							{
								type: "postback",
								title: "Postback starter",
								payload: "postback-payload",
							},
						],
					},
				},
			};

			// Chats in a first session, stubs the socket, then clicks the starter so it is
			// queued behind the notice for a new session. Returns the payloads sent.
			const queueStarterBehindNotice = () => {
				const sent: string[] = [];
				cy.visitWebchat().initMockWebchat({ settings: starterSettings });
				cy.openWebchat();
				cy.startConversation();
				cy.get(".webchat-system-use-notification-accept-button").click();
				cy.sendMessage("hello");

				cy.window().then(win => {
					const client = (win as any).webchat.client;
					cy.stub(client, "sendMessage").callsFake((text: string) => {
						sent.push(text);
					});
					// The mock socket never connects; resolve switches like a reconnect.
					cy.stub(client, "switchSession").callsFake((sessionId?: string) => {
						client.socketOptions.sessionId = sessionId || "session-new";
						return Promise.resolve(client);
					});
				});

				cy.get("button.webchat-header-back-button").click();
				cy.contains("button", "Postback starter").click();
				cy.get(".webchat-system-use-notification-root").should("be.visible");
				cy.window()
					.its("webchat.store")
					.invoke("getState")
					.its("ui.storedMessage.text")
					.should("equal", "postback-payload");
				return sent;
			};

			it("when the user switches to a conversation accepted earlier in this page load", () => {
				const sent = queueStarterBehindNotice();

				// What picking that conversation from Previous conversations dispatches: it was
				// accepted earlier in this page load, so the switch completes immediately.
				cy.window().then(win => {
					const acceptedSessionId = (win as any).webchat.store.getState().ui
						.sunAcceptedSessionIds[0];
					expect(acceptedSessionId).to.be.a("string").and.not.be.empty;
					(win as any).webchat.store.dispatch({
						type: "SWITCH_SESSION",
						sessionId: acceptedSessionId,
					});
				});

				cy.get(".webchat-system-use-notification-root").should("not.exist");
				cy.window()
					.its("webchat.store")
					.invoke("getState")
					.should(state => {
						expect(state.ui.pendingSessionSwitch).to.equal(null);
						expect(state.ui.storedMessage).to.equal(null);
					});
				// Negative check: give the async switch time to send anything it would send
				cy.wait(300);
				cy.wrap(sent).should("not.include", "postback-payload");
			});

			it("when the user goes back and picks the current conversation from the list", () => {
				const sent: { text: string; sessionId: string }[] = [];
				cy.visitWebchat().initMockWebchat({ settings: starterSettings });
				// Let the socket "connect", so the session gets an id and the conversation is
				// saved to the list, as with a real endpoint.
				cy.getWebchat().then(webchat => {
					const client = (webchat as any).client;
					cy.stub(client, "connect").callsFake(() => {
						(webchat as any).store.dispatch({ type: "SET_CONNECTED", connected: true });
						return Promise.resolve(client);
					});
					cy.stub(client, "sendMessage").callsFake((text: string) => {
						sent.push({ text, sessionId: client.socketOptions.sessionId });
					});
					cy.stub(client, "switchSession").callsFake((sessionId?: string) => {
						client.socketOptions.sessionId = sessionId || "session-new";
						return Promise.resolve(client);
					});
				});
				cy.openWebchat();
				cy.startConversation();
				cy.get(".webchat-system-use-notification-accept-button").click();
				cy.window()
					.its("webchat.store")
					.invoke("getState")
					.its("options.sessionId")
					.should("be.a", "string")
					.and("not.be.empty")
					.then(currentSessionId => {
						cy.sendMessage("hello");

						// Click the starter: a switch to a new session waits behind the notice
						cy.get("button.webchat-header-back-button").click();
						cy.contains("button", "Postback starter").click();
						cy.get(".webchat-system-use-notification-root").should("be.visible");

						// Go back and pick the conversation the user was just in
						cy.get("button.webchat-header-back-button").click();
						cy.get("button").contains("Previous conversations").click();
						cy.get(".webchat-prev-conversations-item").should("have.length", 1).click();

						// The user lands in that conversation, without the notice
						cy.get(".webchat-system-use-notification-root").should("not.exist");
						cy.get("#webchatChatHistory").should("exist");
						cy.window()
							.its("webchat.store")
							.invoke("getState")
							.should(state => {
								expect(state.ui.pendingSessionSwitch).to.equal(null);
								expect(state.ui.hasAcceptedSystemUseNotification).to.equal(true);
							});
						cy.window()
							.its("webchat.client.socketOptions.sessionId")
							.should("equal", currentSessionId);
						// Negative check: give the async switch time to send anything it would send
						cy.wait(300);
						cy.wrap(sent).should(calls => {
							expect(calls.map(c => c.text)).not.to.include("postback-payload");
						});
					});
			});

			it("when the user goes back from the notice and starts a conversation instead", () => {
				const sent = queueStarterBehindNotice();

				cy.get("button.webchat-header-back-button").click();
				cy.get(".webchat-homescreen-send-button").click();
				cy.get(".webchat-system-use-notification-accept-button").click();

				cy.window()
					.its("webchat.store")
					.invoke("getState")
					.should(state => {
						expect(state.ui.pendingSessionSwitch).to.equal(null);
						expect(state.ui.storedMessage).to.equal(null);
					});
				// Negative check: give the async switch time to send anything it would send
				cy.wait(300);
				cy.wrap(sent).should("not.include", "postback-payload");
			});
		});

		it("asks once per page load for previous conversations; new conversations always ask", () => {
			const userId = "user-sun-prev-once";
			const seed = (sessionId: string, text: string) => {
				const key = ["webchat-client", userId, sessionId, "fake-url-token"];
				// Stored conversations carry a rating state; switching into one restores it
				const conversation = {
					messages: [{ text, source: "user", timestamp: Date.now() }],
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
				cy.window().then(win => {
					win.localStorage.setItem(JSON.stringify(key), JSON.stringify(conversation));
				});
			};

			cy.visitWebchat();
			seed("session-prev-b", "message B");
			seed("session-prev-c", "message C");
			cy.initMockWebchat({
				userId,
				channel: "channel-sun-prev-once",
				settings: prevConvSettings,
			});
			cy.getWebchat().then(webchat => {
				const client = (webchat as any).client;
				// The mock socket never connects; resolve switches like a reconnect.
				cy.stub(client, "switchSession").callsFake((sessionId?: string) => {
					client.socketOptions.sessionId = sessionId || "session-new";
					return Promise.resolve(client);
				});
			});
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.sendMessage("hello");

			const openPrevConversation = (text: string) => {
				cy.get("button.webchat-header-back-button").click();
				cy.get("button").contains("Previous conversations").click();
				cy.contains(".webchat-prev-conversations-item", text).click();
			};

			// The first previous conversation asks once
			openPrevConversation("message B");
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.window()
				.its("webchat.client.socketOptions.sessionId")
				.should("equal", "session-prev-b");
			cy.sendMessage("in B");

			// Other previous conversations open without the notice
			openPrevConversation("message C");
			cy.get(".webchat-system-use-notification-root").should("not.exist");
			cy.window()
				.its("webchat.client.socketOptions.sessionId")
				.should("equal", "session-prev-c");
			cy.sendMessage("in C");

			// A new conversation still asks
			cy.get("button.webchat-header-back-button").click();
			cy.get("button").contains("Previous conversations").click();
			cy.get(".webchat-prev-conversations-send-button").click();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
		});

		it("opening from teaser shows SUN, not chat history", () => {
			// openConversationFromTeaser uses isNoticePending; when SUN is pending it
			// must NOT dispatch SHOW_CHAT_SCREEN (which would connect the socket).
			cy.visitWebchat().initMockWebchat({
				settings: {
					...sunSettings,
					teaserMessage: {
						text: "Need help? Chat with us",
						teaserMessageDelay: 0,
					},
				},
			});

			// Wait for the teaser to appear, then click the teaser bubble itself —
			// this invokes openConversationFromTeaser (the FAB toggle routes through
			// Webchat._open() instead, which is a different code path).
			// Target the bubble by class: cy.contains would match the sr-only live-region copy of the
			// text (earlier in the DOM), and clicking that never triggers the teaser.
			cy.get(".webchat-teaser-message-bubble", { timeout: 6000 })
				.should("be.visible")
				.and("contain.text", "Need help? Chat with us")
				.click();

			// SUN must be shown — socket must not have connected
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.get("#webchatChatHistory").should("not.exist");
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("SUN surface has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-root").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("chat surface after SUN acceptance has no detectable a11y violations", () => {
			cy.visitWebchat().initMockWebchat({ settings: sunSettings });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-system-use-notification-accept-button").click();
			cy.get("#webchatChatHistory").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
