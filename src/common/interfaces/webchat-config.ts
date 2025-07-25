export type TSourceDirection = "incoming" | "outgoing";
export type TSourceColorV2 = "primary" | "neutral";
export type TSourceColor = "bot" | "user";

export interface IWebchatConfig {
	active: boolean;
	URLToken: string;
	initialSessionId: string;
	settings: IWebchatSettings;
	isConfigLoaded: boolean;
	isTimedOut: boolean;
}

export interface IBusinessHours {
	startTime: string;
	endTime: string;
	weekDay: string;
}

export interface IWebchatV2Settings {
	awaitEndpointConfig: boolean;
	agentAvatarUrl: string;
	backgroundImageUrl: string;
	businessHours: {
		businessHours: IBusinessHours[];
		enabled: boolean;
		mode: string;
		text: string;
		timeZone: string;
		title: string;
	};
	colorScheme: string;
	connectivity: {
		enabled: boolean;
		mode: string;
		text: string;
		timeout: number;
		title: string;
	};
	designTemplate: number;
	disableBranding: boolean;
	disableDefaultReplyCompatiblityMode: boolean;
	disableHtmlContentSanitization: boolean;
	disableHtmlInput: boolean;
	disableInputAutocomplete: boolean;
	disableInputAutofocus: boolean;
	disableLocalStorage: boolean;
	disablePersistentHistory: boolean;
	disableRenderURLsAsLinks: boolean;
	disableTextInputSanitization: boolean;
	disableToggleButton: boolean;
	disableUrlButtonSanitization: boolean;
	dynamicImageAspectRatio: boolean;
	enableAutoFocus: boolean;
	enableConnectionStatusIndicator: boolean;
	enableFileUpload: boolean;
	enableFocusTrap: boolean;
	enableGenericHTMLStyling: boolean;
	enableInjectionWithoutEmptyHistory: boolean;
	enableInputCollation: boolean;
	enableRating: "always" | "once" | "onRequest";
	enableStrictMessengerSync: boolean;
	enableSTT: boolean;
	enableTTS: boolean;
	enableTypingIndicator: boolean;
	enableUnreadMessageBadge: boolean;
	enableUnreadMessagePreview: boolean;
	enableUnreadMessageSound: boolean;
	enableUnreadMessageTitleIndicator: boolean;
	enableDefaultPreview: boolean;
	enableFileAttachment: boolean;
	fileAttachmentMaxSize: number;
	engagementMessageDelay: number;
	engagementMessageText: string;
	focusInputAfterPostback: boolean;
	getStartedButtonText: string;
	getStartedData: object;
	getStartedPayload: string;
	getStartedText: string;
	headerLogoUrl: string;
	ignoreLineBreaks: boolean;
	inputAutogrowMaxRows: number;
	inputCollationTimeout: number;
	inputPlaceholder: string;
	maintenance: {
		enabled: boolean;
		mode: string;
		text: string;
		title: string;
	};
	/** TODO: this is the botAvatarUrl (rename for major) */
	messageLogoUrl: string;
	ratingCommentText: string;
	ratingMessageHistoryCommentText: string;
	ratingMessageHistoryRatingText: string;
	ratingTitleText: string;
	showEngagementMessagesInChat: boolean;
	startBehavior: "none" | "button" | "injection";
	STTLanguage: string;
	title: string;
	unreadMessageTitleText: string;
	unreadMessageTitleTextPlural: string;
	userAvatarUrl: string;
	useSessionStorage: boolean;
	sourceDirectionMapping: {
		agent: TSourceDirection;
		bot: TSourceDirection;
		engagement: TSourceDirection;
		user: TSourceDirection;
	};
	sourceColorMapping: {
		agent: TSourceColorV2;
		bot: TSourceColorV2;
		engagement: TSourceColorV2;
		user: TSourceColorV2;
	};
	_endpointTokenUrl: string;
	privacyMessage: string;
	privacyUrl: string;
}

export interface IPersistentMenuItem {
	title: string;
	payload: string;
}

export interface IPersistentMenu {
	title: string;
	menuItems: IPersistentMenuItem[];
}

export interface IWebchatSettings {
	// Settings that are also configurable via the Endpoint Editor in Cognigy.AI
	layout: {
		title: string;
		logoUrl: string;
		useOtherAgentLogo: boolean;
		botAvatarName: string;
		botLogoUrl: string;
		agentAvatarName: string;
		agentLogoUrl: string;
		inputAutogrowMaxRows: number;
		enableInputCollation: boolean;
		enablePersistentMenu: boolean;
		persistentMenu: IPersistentMenu;
		inputCollationTimeout: number;
		dynamicImageAspectRatio: boolean;
		disableInputAutocomplete: boolean;
		enableGenericHTMLStyling: boolean;
		disableHtmlContentSanitization: boolean;
		disableUrlButtonSanitization: boolean;
		watermark: "default" | "custom" | "none";
		watermarkText: string;
		watermarkUrl: string;
		disableBotOutputBorder: boolean;
		botOutputMaxWidthPercentage: number;
		chatWindowWidth: number;
	};
	colors: {
		primaryColor: string;
		secondaryColor: string;
		chatInterfaceColor: string;
		botMessageColor: string;
		userMessageColor: string;
		textLinkColor: string;
	};
	behavior: {
		collateStreamedOutputs: boolean;
		progressiveMessageRendering: boolean;
		renderMarkdown: boolean;
		enableAIAgentNotice: boolean;
		AIAgentNoticeText: string;
		enableTypingIndicator: boolean;
		messageDelay: number;
		inputPlaceholder: string;
		enableSTT: boolean;
		enableTTS: boolean;
		focusInputAfterPostback: boolean;
		enableConnectionStatusIndicator: boolean;
		scrollingBehavior: "alwaysScroll" | "scrollUntilLastInputAtTop";
		enableScrollButton: boolean;
		disableUserTypingEvent: boolean;
	};
	startBehavior: {
		startBehavior: "none" | "button" | "injection";
		getStartedPayload: string;
		getStartedData: object;
		getStartedText: string;
		getStartedButtonText: string;
	};
	fileStorageSettings?: {
		enabled?: boolean;
		dropzoneText?: string;
	};
	businessHours: {
		enabled: boolean;
		mode: "inform" | "hide" | "disable";
		text: string;
		title: string;
		timeZone: string;
		times: {
			startTime: string;
			endTime: string;
			weekDay: string;
		}[];
	};
	unreadMessages: {
		enableIndicator: boolean;
		enableBadge: boolean;
		enablePreview: boolean;
		enableSound: boolean;
		unreadMessageTitleText: string;
		unreadMessageTitleTextPlural: string;
	};
	homeScreen: {
		enabled: boolean;
		welcomeText: string;
		background: {
			imageUrl: string;
			color: string;
		};
		startConversationButtonText: string;
		previousConversations: {
			startNewConversationButtonText: string;
			enableDeleteAllConversations?: boolean;
			enabled: boolean;
			buttonText: string;
			title: string;
		};
		conversationStarters: {
			enabled: boolean;
			starters: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
	};
	teaserMessage: {
		text: string;
		teaserMessageDelay: number;
		showInChat: boolean;
		conversationStarters: {
			enabled: boolean;
			starters: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
	};
	chatOptions: {
		enabled: boolean;
		title: string;
		quickReplyOptions: {
			enabled: boolean;
			sectionTitle: string;
			quickReplies: {
				type: "postback" | "web_url" | "phone_number";
				title: string;
				url?: string;
				payload?: string;
			}[];
		};
		showTTSToggle: boolean;
		activateTTSToggle: boolean;
		labelTTSToggle: string;
		rating: {
			enabled: "no" | "once" | "always";
			title: string;
			commentPlaceholder: string;
			submitButtonText: string;
			eventBannerText: string;
		};
		enableDeleteConversation?: boolean;
		footer: {
			enabled: boolean;
			items: {
				title: string;
				url: string;
			}[];
		};
	};
	privacyNotice: {
		enabled: boolean;
		title: string;
		text: string;
		submitButtonText: string;
		urlText: string;
		url: string;
	};
	fileAttachmentMaxSize: number;
	maintenance: {
		enabled: boolean;
		mode: "inform" | "hide" | "disable";
		text: string;
		title: string;
	};
	customColors: {
		deleteButtonColor: string; // #E55050
		cancelButtonColor: string; // #CCCCCC
		deleteAllConversationIconColor: string; //#1A1A1A
	};
	customTranslations?: {
		network_error: string;
		no_network: string;
		reconnect: string;
		reconnecting: string;
		delete_all_conversations: string;
		delete_all_conversations_confirmation: string;
		delete_conversation: string;
		delete_conversation_confirmation: string;
		delete: string;
		delete_anyway: string;
		cancel: string;
		datePickerMonthLabel?: string;
		datePickerYearLabel?: string;
		ariaLabels?: {
			chatRegion?: string;
			scrollToBottom?: string;
			closeDialog?: string;
			togglePersistentMenu?: string;
			addAttachment?: string;
			speechToText?: string;
			sendMessage?: string;
			removeFileAttachment?: string;
			closeConnectionWarning?: string;
			goBack?: string;
			deleteAllConversations?: string;
			chatOptions?: string;
			minimizeChat?: string;
			closeChat?: string;
			openChat?: string;
			unreadMessages?: string;
			unreadMessageSingularText?: string;
			unreadMessagePluralText?: string;
			closeTeaserMessage?: string;
			thumbsUp?: string;
			thumbsDown?: string;
			openConversation?: string;
			chatHistory?: string;
			homeScreen?: string;
			newMessagePreview?: string;
			opensInNewTab?: string;
			// The following is used by chat components
			audioPlaybackProgress?: string;
			pauseAudio?: string;
			playAudio?: string;
			playVideo?: string;
			downloadTranscript?: string;
			closeDatePicker?: string;
			viewImageInFullsize?: string;
			fullSizeImageViewerTitle?: string;
			downloadFullsizeImage?: string;
			closeFullsizeImageModal?: string;
			datePickerPreviousMonth?: string;
			datePickerNextMonth?: string;
			actionButtonPositionText?: string;
			buttonGroupLabel?: string;
			slidesCountText?: string;
			slide?: string;
			listItemGroupLabel?: string;
			imageContent?: {
				downloadable?: string;
				nonDownloadable?: string;
			};
			videoContent?: {
				withTranscriptAndCaptions?: string;
				withTranscript?: string;
				withCaptions?: string;
				withoutTranscriptAndCaptions?: string;
			};
			audioContent?: {
				withTranscript?: string;
				withoutTranscript?: string;
			};
			fileContent?: {
				singleFile?: string;
				multipleFiles?: string;
			};
			messageHeader?: {
				user?: string;
				bot?: string;
				timestamp?: string;
			};
			audioTimeRemaining?: string;
		};
	};
	demoWebchat: {
		enabled: boolean;
		backgroundImageUrl: string;
		position: "centered" | "bottomRight";
	};

	// Settings related to the webchat browser embedding
	// These settings are NOT configurable via the Endpoint Editor in Cognigy.AI
	embeddingConfiguration: {
		_endpointTokenUrl: string;
		awaitEndpointConfig: boolean;
		disableLocalStorage: boolean;
		disablePersistentHistory: boolean;
		useSessionStorage: boolean;
		connectivity: {
			enabled: boolean;
			mode: string;
			text: string;
			timeout: number;
			title: string;
		};
	};

	// Additional Settings to configure the webchat widget behavior
	// These settings are NOT configurable via the Endpoint Editor in Cognigy.AI
	widgetSettings: {
		disableDefaultReplyCompatiblityMode: boolean;
		enableStrictMessengerSync: boolean;

		disableHtmlInput: boolean;
		disableInputAutofocus: boolean;
		disableRenderURLsAsLinks: boolean;
		disableTextInputSanitization: boolean;
		disableToggleButton: boolean;
		disableTeaserMarkdownRemoval: boolean;
		enableAutoFocus: boolean;
		enableInjectionWithoutEmptyHistory: boolean;
		enableFocusTrap: boolean;
		enableDefaultPreview: boolean;
		ignoreLineBreaks: boolean;
		STTLanguage: string;
		customAllowedHtmlTags?: string[];

		sourceDirectionMapping: {
			agent: TSourceDirection;
			bot: TSourceDirection;
			user: TSourceDirection;
		};
		sourceColorMapping: {
			agent: TSourceColor;
			bot: TSourceColor;
			user: TSourceColor;
		};
	};
}
