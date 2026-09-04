/**
 * Accessibility of endpoint-configurable settings (WCAG 2.2 AA).
 *
 * The other a11y specs run on the default theme and default settings. This
 * spec covers the settings a project can change in the Endpoint Editor (and
 * the embedding options) that alter what is rendered, so a configuration
 * that ships to customers is also what gets checked: custom colors, speech
 * input, the get-started button, the scroll-to-bottom button, maintenance
 * and business-hours modes, custom logos and avatars, and the configurable
 * aria labels. Default-theme checks live in the feature specs.
 */

describe("Endpoint settings — Accessibility (WCAG 2.2 AA)", () => {
	const ROOT = "[data-cognigy-webchat-root]";

	// A plausible customer palette that differs from the default in every slot.
	// Contrast of derived colors (text on primary, links, user bubble) is what
	// the sweeps verify; a palette that fails here is a real product defect, a
	// palette a customer picks badly is theirs.
	const PALETTE = {
		primaryColor: "#0B6E4F",
		secondaryColor: "#2B2B2B",
		chatInterfaceColor: "#F4F6F5",
		botMessageColor: "#FFFFFF",
		userMessageColor: "#DCEFE7",
		textLinkColor: "#0A4DA3",
	};

	// Hermetic 32×32 square so logo/avatar tests do not depend on the network.
	const SQUARE_IMAGE =
		"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='%230B6E4F'/></svg>";

	const receiveManyMessages = (count: number) => {
		for (let i = 0; i < count; i++) {
			cy.receiveMessage(
				`Bot line ${i + 1}: lorem ipsum dolor sit amet consectetur adipiscing`,
			);
		}
	};

	beforeEach(() => {
		cy.visitWebchat();
	});

	describe("Custom theme colors (settings.colors)", () => {
		it("home screen with custom colors, background and conversation starters has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					colors: PALETTE,
					homeScreen: {
						enabled: true,
						background: { color: "#E6F2EE" },
						previousConversations: { enabled: true },
						conversationStarters: {
							enabled: true,
							starters: [
								{ type: "postback", title: "Postback starter", payload: "p" },
								{
									type: "web_url",
									title: "Web starter",
									url: "https://example.com",
								},
							],
						},
					},
				},
			});
			cy.openWebchat();
			cy.get(".webchat-homescreen-content").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});

		it("chat screen with custom colors and mixed content has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					colors: PALETTE,
					homeScreen: { enabled: false },
					behavior: { renderMarkdown: true },
					layout: {
						enablePersistentMenu: true,
						persistentMenu: {
							title: "Chat Menu",
							menuItems: [{ title: "Option 1", payload: "opt1" }],
						},
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.visible");

			// markdown text (link color), a user bubble, buttons, quick replies and a list
			cy.receiveMessage(
				"Hello **there**, see [the docs](https://example.com) and\n\n- one\n- two",
			);
			cy.sendMessage("my reply");
			cy.receiveMessageFixture("buttons");
			cy.receiveMessageFixture("list");
			cy.get(".webchat-message-row a[href='https://example.com']").should("be.visible");
			cy.get(".webchat-message-row.user").should("be.visible");
			cy.get(".webchat-list-template-root").should("be.visible");
			cy.checkA11yCompliance(ROOT);

			cy.get(".webchat-input-persistent-menu-button").click();
			cy.get(".webchat-input-persistent-menu").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});

		it("chat options, rating and the delete dialog with custom button colors have no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					colors: PALETTE,
					homeScreen: { enabled: false },
					customColors: { deleteButtonColor: "#9B1C1C", cancelButtonColor: "#EEEEEE" },
					chatOptions: {
						enabled: true,
						showTTSToggle: true,
						rating: { enabled: "always" },
						enableDeleteConversation: true,
						quickReplyOptions: {
							enabled: true,
							quickReplies: [
								{ type: "postback", title: "Quick Reply", payload: "qr" },
							],
						},
						footer: {
							enabled: true,
							items: [{ title: "Imprint", url: "https://example.com" }],
						},
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-chat-options-root").should("be.visible");
			cy.checkA11yCompliance(ROOT);

			cy.get(".webchat-delete-conversation-button").click();
			cy.get(".webchat-modal-root").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});

		it("closed toggle with unread badge and a teaser with conversation starters has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					colors: PALETTE,
					unreadMessages: {
						enableBadge: true,
						enableIndicator: true,
						enablePreview: true,
					},
					teaserMessage: {
						text: "Hi there, need help?",
						teaserMessageDelay: 100,
						conversationStarters: {
							enabled: true,
							starters: [
								{ type: "postback", title: "Yes please", payload: "yes" },
								{
									type: "web_url",
									title: "Read the docs",
									url: "https://example.com",
								},
							],
						},
					},
				},
			});
			cy.get(".webchat-teaser-message-root").should("be.visible");
			cy.get(".webchat-teaser-message-button").should("have.length", 2);
			cy.get(".webchat-unread-message-badge").should("have.text", "1");
			cy.get("#webchatWindowToggleButton").should(
				"have.attr",
				"aria-label",
				"One unread message in chat. Open chat",
			);
			cy.checkA11yCompliance(ROOT);
		});
	});

	describe("Speech-to-text (behavior.enableSTT)", () => {
		it("speech button is a named native button whose disabled state follows browser support", () => {
			cy.initMockWebchat({
				settings: { homeScreen: { enabled: false }, behavior: { enableSTT: true } },
			});
			cy.openWebchat().startConversation();

			cy.window().then(win => {
				const supported = "SpeechRecognition" in win || "webkitSpeechRecognition" in win;
				cy.get("#webchatInputMessageSpeechButton")
					.should("match", "button")
					.and("have.attr", "aria-label", "Speech to text")
					.and(supported ? "not.be.disabled" : "be.disabled");
			});
			cy.checkA11yCompliance(ROOT);
		});
	});

	describe("Get started button (startBehavior: button)", () => {
		it("is a named native button that takes focus and hands focus to the message input after use", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					startBehavior: {
						startBehavior: "button",
						getStartedButtonText: "Get started",
						getStartedPayload: "GET_STARTED",
						getStartedText: "Hello",
					},
				},
			});
			cy.openWebchat().startConversation();

			// the sole call to action in the input area is focused on mount
			cy.get("#webchatGetStartedButton")
				.should("match", "button")
				.and("have.text", "Get started")
				.and("be.focused");
			cy.checkA11yCompliance(ROOT);

			cy.get("#webchatGetStartedButton").click();
			cy.get(".webchat-message-row.user").should("contain.text", "Hello");
			cy.get("#webchatGetStartedButton").should("not.exist");
			cy.get(".webchat-input-message-input").should("be.focused");
		});
	});

	describe("Scroll-to-bottom button (behavior.enableScrollButton)", () => {
		it("appears when the log is scrolled up, is a named native button of sufficient size, and scrolls the log to the bottom", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					behavior: { enableScrollButton: true },
					customTranslations: {
						ariaLabels: { scrollToBottom: "Jump to the newest message" },
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.visible");
			receiveManyMessages(14);
			cy.get(".webchat-message-row").should("have.length", 14);

			cy.get("#webchatChatHistory").scrollTo("top");
			cy.get(".webchat-scroll-to-bottom-button")
				.should("be.visible")
				.and("match", "button")
				.and("have.attr", "aria-label", "Jump to the newest message")
				.then($button => {
					// SC 2.5.8 Target Size (Minimum): 24×24 CSS px
					const { width, height } = $button[0].getBoundingClientRect();
					expect(width, "width").to.be.at.least(24);
					expect(height, "height").to.be.at.least(24);
				});
			cy.checkA11yCompliance(ROOT);

			cy.get(".webchat-scroll-to-bottom-button").click();
			cy.get(".webchat-scroll-to-bottom-button").should("not.exist");
			cy.get("#webchatChatHistory").should($log => {
				const log = $log[0];
				expect(
					log.scrollHeight - log.scrollTop - log.clientHeight,
					"distance to bottom",
				).to.be.lessThan(5);
			});
		});
	});

	describe("Maintenance and business hours (inform / disable modes)", () => {
		// These modes only apply when the widget waits for the endpoint config.
		const awaitConfig = { embeddingConfiguration: { awaitEndpointConfig: true } };

		it("maintenance inform screen exposes the message as text and has no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					...awaitConfig,
					maintenance: {
						enabled: true,
						mode: "inform",
						title: "Maintenance",
						text: "Down for maintenance until noon",
					},
				},
			});
			cy.get("#webchatWindowToggleButton").click();
			cy.get(".webchat-information-message-root").should(
				"contain.text",
				"Down for maintenance until noon",
			);
			cy.get(".webchat-header-bar .webchat-header-title").should("have.text", "Maintenance");
			// no input to focus on this screen — focus lands on the first header control
			cy.focused().should("have.class", "webchat-header-minimize-button");
			cy.checkA11yCompliance(ROOT);
		});

		it("business hours inform screen exposes the message as text and has no detectable a11y violations", () => {
			const weekdays = [
				"sunday",
				"monday",
				"tuesday",
				"wednesday",
				"thursday",
				"friday",
				"saturday",
			];
			// a weekday at least three days away from today in any time zone => always out of hours
			const otherWeekday = weekdays[(new Date().getDay() + 3) % 7];
			cy.initMockWebchat({
				settings: {
					...awaitConfig,
					businessHours: {
						enabled: true,
						mode: "inform",
						title: "Closed",
						text: "We are closed right now",
						timeZone: "Europe/Berlin",
						times: [{ weekDay: otherWeekday, startTime: "09:00", endTime: "17:00" }],
					},
				},
			});
			cy.get("#webchatWindowToggleButton").click();
			cy.get(".webchat-information-message-root").should(
				"contain.text",
				"We are closed right now",
			);
			cy.get(".webchat-header-bar .webchat-header-title").should("have.text", "Closed");
			cy.checkA11yCompliance(ROOT);
		});

		it("maintenance disable mode renders a disabled toggle named with the reason", () => {
			cy.initMockWebchat({
				settings: {
					...awaitConfig,
					maintenance: { enabled: true, mode: "disable", text: "Down for maintenance" },
				},
			});
			cy.get("#webchatWindowToggleButton")
				.should("match", "button")
				.and("be.disabled")
				.and("have.attr", "aria-label", "Down for maintenance");
			cy.get("#webchatWindow").should("not.exist");
			cy.checkA11yCompliance(ROOT);
		});
	});

	describe("Logos and avatars (layout.logoUrl / botLogoUrl / agentLogoUrl)", () => {
		it("header logo and message avatars are decorative images and have no detectable a11y violations", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					layout: {
						logoUrl: SQUARE_IMAGE,
						botLogoUrl: SQUARE_IMAGE,
						agentLogoUrl: SQUARE_IMAGE,
						useOtherAgentLogo: true,
					},
				},
			});
			cy.openWebchat().startConversation();
			cy.receiveMessage("Hello from the bot", undefined, "bot");
			cy.receiveMessage("Hello from the agent", undefined, "agent");

			// the sender is conveyed by the message header, so the images are decorative
			cy.get(".webchat-header-logo").should("match", "img").and("have.attr", "alt", "");
			cy.get(".webchat-message-row img.webchat-avatar")
				.should("have.length.at.least", 2)
				.each($img => expect($img).to.have.attr("alt", ""));
			cy.checkA11yCompliance(ROOT);
		});
	});

	describe("Configurable aria labels (customTranslations.ariaLabels)", () => {
		// Every label is set to a sentinel and asserted on the element it names.
		// Not covered here because they need a real endpoint or socket:
		// openConversation / deleteAllConversations (prevConvesations.cy.ts) and
		// closeConnectionWarning (reconnection.cy.ts). homeScreen, newMessagePreview,
		// typingIndicator, togglePersistentMenu, addAttachment and removeFileAttachment
		// are asserted in their feature specs.
		const LABELS = {
			chatRegion: "Custom chat region",
			openChat: "Custom open chat",
			closeChat: "Custom close chat",
			minimizeChat: "Custom minimize chat",
			goBack: "Custom go back",
			chatOptions: "Custom chat options",
			sendMessage: "Custom send message",
			speechToText: "Custom speech to text",
			chatHistory: "Custom chat history",
			opensInNewTab: "Custom opens in new tab",
			thumbsUp: "Custom like",
			thumbsDown: "Custom dislike",
			closeDialog: "Custom close dialog",
			closeTeaserMessage: "Custom close teaser",
			unreadMessages: "custom unread",
			unreadMessageSingularText: "Custom one unread message",
			unreadMessagePluralText: "custom unread messages",
		};

		it("closed widget: toggle, unread badge and teaser labels", () => {
			cy.initMockWebchat({
				settings: {
					customTranslations: { ariaLabels: LABELS },
					unreadMessages: {
						enableBadge: true,
						enableIndicator: true,
						enablePreview: true,
					},
					teaserMessage: { text: "Teaser text", teaserMessageDelay: 100 },
				},
			});
			cy.get(".webchat-teaser-message-root").should("be.visible");
			cy.get(".webchat-teaser-message-header-close-button").should(
				"have.attr",
				"aria-label",
				LABELS.closeTeaserMessage,
			);
			// the teaser counts as one unseen message
			cy.get("#webchatWindowToggleButton").should(
				"have.attr",
				"aria-label",
				LABELS.unreadMessageSingularText,
			);
			cy.get(".webchat-unread-message-badge").should(
				"have.attr",
				"aria-label",
				`1 ${LABELS.unreadMessages}`,
			);

			cy.receiveMessage("second message");
			cy.get("#webchatWindowToggleButton").should(
				"have.attr",
				"aria-label",
				`2 ${LABELS.unreadMessagePluralText}`,
			);

			cy.get("#webchatWindowToggleButton").click();
			cy.get(".webchat-homescreen-close-button").should(
				"have.attr",
				"aria-label",
				LABELS.closeChat,
			);
		});

		it("open widget: region, header, input, chat log, branding, rating and dialog labels", () => {
			cy.initMockWebchat({
				settings: {
					customTranslations: { ariaLabels: LABELS },
					homeScreen: { enabled: true },
					behavior: { enableSTT: true },
					chatOptions: {
						enabled: true,
						rating: { enabled: "always" },
						enableDeleteConversation: true,
					},
				},
			});
			cy.get(ROOT).should("have.attr", "aria-label", LABELS.chatRegion);
			// no unseen messages yet, so the toggle carries the plain open label
			cy.get("#webchatWindowToggleButton").should("have.attr", "aria-label", LABELS.openChat);
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.visible");

			cy.get(".webchat-header-back-button").should("have.attr", "aria-label", LABELS.goBack);
			cy.get("[data-header-menu-button]").should(
				"have.attr",
				"aria-label",
				LABELS.chatOptions,
			);
			cy.get(".webchat-header-minimize-button").should(
				"have.attr",
				"aria-label",
				LABELS.minimizeChat,
			);
			cy.get(".webchat-header-close-button").should(
				"have.attr",
				"aria-label",
				LABELS.closeChat,
			);
			cy.get("#webchatInputMessageSendMessageButton").should(
				"have.attr",
				"aria-label",
				LABELS.sendMessage,
			);
			cy.get("#webchatInputMessageSpeechButton").should(
				"have.attr",
				"aria-label",
				LABELS.speechToText,
			);
			cy.get("#webchatChatHistoryHeading").should("have.text", LABELS.chatHistory);
			cy.get("#cognigyBrandingLink")
				.invoke("attr", "aria-label")
				.should("contain", LABELS.opensInNewTab);

			cy.get("[data-header-menu-button]").click();
			cy.get(".webchat-chat-options-root").should("be.visible");
			cy.get(`button[aria-label="${LABELS.thumbsUp}"]`).should("exist");
			cy.get(`button[aria-label="${LABELS.thumbsDown}"]`).should("exist");

			cy.get(".webchat-delete-conversation-button").click();
			cy.get(".webchat-modal-close-button").should(
				"have.attr",
				"aria-label",
				LABELS.closeDialog,
			);
		});
	});
});
