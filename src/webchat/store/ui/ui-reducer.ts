import { Reducer } from "redux";
import { IMessage } from "../../../common/interfaces/message";
import { TTyping } from "../../../common/interfaces/typing";
import { isPageVisible } from "../../helper/page-visibility";
import { ISendMessageOptions } from "../messages/message-middleware";

export interface UIState {
	open: boolean;
	typing: TTyping;
	inputMode: string;
	fullscreenMessage: IMessage | undefined;
	agentAvatarOverrideUrl?: string;
	botAvatarOverrideUrl?: string;
	isPageVisible: boolean;
	showHomeScreen: boolean;
	showPrevConversations: boolean;
	showChatOptionsScreen: boolean;
	showPreviousConversationsOptionsScreen: boolean;
	hasAcceptedTerms: boolean;
	storedMessage: {
		text?: string;
		data?: any;
		options?: Partial<ISendMessageOptions>;
	} | null;
	ttsActive: boolean;
	lastInputId: string;
}

export const SET_OPEN = "SET_OPEN";
export const setOpen = (open: boolean) => ({
	type: SET_OPEN as "SET_OPEN",
	open,
});
export type SetOpenAction = ReturnType<typeof setOpen>;

const TOGGLE_OPEN = "TOGGLE_OPEN";
export const toggleOpen = () => ({
	type: TOGGLE_OPEN as "TOGGLE_OPEN",
});
export type ToggleOpenAction = ReturnType<typeof toggleOpen>;

export const SET_SHOW_HOME_SCREEN = "SET_SHOW_HOME_SCREEN";
export const setShowHomeScreen = (showHomeScreen: boolean) => ({
	type: SET_SHOW_HOME_SCREEN as "SET_SHOW_HOME_SCREEN",
	showHomeScreen,
});
export type SetShowHomeScreenAction = ReturnType<typeof setShowHomeScreen>;

export const SHOW_CHAT_SCREEN = "SHOW_CHAT_SCREEN";
export const showChatScreen = () => ({
	type: SHOW_CHAT_SCREEN as "SHOW_CHAT_SCREEN",
});
export type ShowChatScreenAction = ReturnType<typeof showChatScreen>;

export const SET_SHOW_PREV_CONVERSATIONS = "SET_SHOW_PREV_CONVERSATIONS";
export const setShowPrevConversations = (showPrevConversations: boolean) => ({
	type: SET_SHOW_PREV_CONVERSATIONS as "SET_SHOW_PREV_CONVERSATIONS",
	showPrevConversations,
});
export type SetShowPrevConversationsAction = ReturnType<typeof setShowPrevConversations>;

export const SET_SHOW_CHAT_OPTIONS = "SET_SHOW_CHAT_OPTIONS";
export const setShowChatOptionsScreen = (showChatOptionsScreen: boolean) => ({
	type: SET_SHOW_CHAT_OPTIONS as "SET_SHOW_CHAT_OPTIONS",
	showChatOptionsScreen,
});
export type SetShowChatOptionsScreenAction = ReturnType<typeof setShowChatOptionsScreen>;


export const SET_SHOW_PREVIOUS_CONVERSATIONS_OPTIONS_SCREEN = "SET_SHOW_PREVIOUS_CONVERSATIONS_OPTIONS_SCREEN" as const;
export const setShowPreviousConversationsOptionsScreen = (showChatOptionsScreen: boolean) => ({
	type: SET_SHOW_PREVIOUS_CONVERSATIONS_OPTIONS_SCREEN,
	showChatOptionsScreen,
});

export type SetShowPreviousConversationsOptionsScreen = ReturnType<typeof setShowPreviousConversationsOptionsScreen>;

const SET_TYPING = "SET_TYPING";
export const setTyping = (typing: TTyping) => ({
	type: SET_TYPING as "SET_TYPING",
	typing,
});
type SetTypingAction = ReturnType<typeof setTyping>;

const SET_INPUT_MODE = "SET_INPUT_MODE";
export const setInputMode = (inputMode: string) => ({
	type: SET_INPUT_MODE as "SET_INPUT_MODE",
	inputMode,
});
type SetInputModeAction = ReturnType<typeof setInputMode>;

const SET_FULLSCREEN_MESSAGE = "SET_FULLSCREEN_MESSAGE";
export const setFullscreenMessage = (fullscreenMessage: IMessage | undefined) => ({
	type: SET_FULLSCREEN_MESSAGE as "SET_FULLSCREEN_MESSAGE",
	fullscreenMessage,
});
type SetFullscreenMessageAction = ReturnType<typeof setFullscreenMessage>;

const SET_AGENT_AVATAR_OVERRIDE_URL = "SET_AGENT_AVATAR_OVERRIDE_URL";
export const setAgentAvatarOverrideUrl = (url: string) => ({
	type: SET_AGENT_AVATAR_OVERRIDE_URL as "SET_AGENT_AVATAR_OVERRIDE_URL",
	url,
});
type SetAgentAvatarOverrideUrlAction = ReturnType<typeof setAgentAvatarOverrideUrl>;

const SET_BOT_AVATAR_OVERRIDE_URL = "SET_BOT_AVATAR_OVERRIDE_URL";
export const setBotAvatarOverrideUrl = (url: string) => ({
	type: SET_BOT_AVATAR_OVERRIDE_URL as "SET_BOT_AVATAR_OVERRIDE_URL",
	url,
});
type SetBotAvatarOverrideUrlAction = ReturnType<typeof setBotAvatarOverrideUrl>;

const SET_PAGE_VISIBLE = "SET_PAGE_VISIBLE";
export const setPageVisible = (visible: boolean) => ({
	type: SET_PAGE_VISIBLE as "SET_PAGE_VISIBLE",
	visible,
});
export type SetPageVisibleAction = ReturnType<typeof setPageVisible>;

const SET_HAS_ACCEPTED_TERMS = "SET_HAS_ACCEPTED_TERMS";
export const setHasAcceptedTerms = (userId: string) => ({
	type: SET_HAS_ACCEPTED_TERMS as "SET_HAS_ACCEPTED_TERMS",
	userId,
});
export type SetHasAcceptedTermsAction = ReturnType<typeof setHasAcceptedTerms>;

const SET_STORED_MESSAGE = "SET_STORED_MESSAGE";
export const setStoredMessage = (message: UIState["storedMessage"]) => ({
	type: SET_STORED_MESSAGE as "SET_STORED_MESSAGE",
	message,
});
export type SetStoredMessageAction = ReturnType<typeof setStoredMessage>;

const SET_TTS_ACTIVE = "SET_TTS_ACTIVE";
export const setTTSActive = (active: boolean) => ({
	type: SET_TTS_ACTIVE as "SET_TTS_ACTIVE",
	active,
});
export type SetTTSActiveAction = ReturnType<typeof setTTSActive>;

const SET_LAST_INPUT_ID = "SET_LAST_INPUT_ID";
export const setLastInputId = (id: string) => ({
	type: SET_LAST_INPUT_ID as "SET_LAST_INPUT_ID",
	id,
});
export type SetLastInputIdAction = ReturnType<typeof setLastInputId>;

const getInitialState = (): UIState => ({
	open: false,
	typing: "remove",
	inputMode: "text",
	fullscreenMessage: undefined,
	agentAvatarOverrideUrl: undefined,
	botAvatarOverrideUrl: undefined,
	isPageVisible: isPageVisible(),
	showHomeScreen: true,
	showPrevConversations: false,
	showChatOptionsScreen: false,
	hasAcceptedTerms: false,
	storedMessage: null,
	ttsActive: false,
	showPreviousConversationsOptionsScreen: false,
	lastInputId: "",
});

type UIAction =
	| SetOpenAction
	| SetTypingAction
	| SetInputModeAction
	| SetFullscreenMessageAction
	| SetAgentAvatarOverrideUrlAction
	| SetBotAvatarOverrideUrlAction
	| SetPageVisibleAction
	| SetShowHomeScreenAction
	| SetShowPrevConversationsAction
	| SetShowChatOptionsScreenAction
	| SetShowPreviousConversationsOptionsScreen
	| SetHasAcceptedTermsAction
	| SetStoredMessageAction
	| SetTTSActiveAction
	| SetLastInputIdAction;

export const ui: Reducer<UIState, UIAction> = (state = getInitialState(), action) => {
	switch (action.type) {
		case SET_OPEN: {
			return {
				...state,
				open: action.open,
			};
		}

		case SET_TYPING: {
			return {
				...state,
				typing: action.typing,
			};
		}

		case SET_SHOW_HOME_SCREEN: {
			return {
				...state,
				showHomeScreen: action.showHomeScreen,
			};
		}

		case SET_SHOW_PREV_CONVERSATIONS: {
			return {
				...state,
				showPrevConversations: action.showPrevConversations,
			};
		}

		case SET_SHOW_CHAT_OPTIONS: {
			return {
				...state,
				showChatOptionsScreen: action.showChatOptionsScreen,
			};
		}

		case SET_SHOW_PREVIOUS_CONVERSATIONS_OPTIONS_SCREEN: {
			return {
				...state,
				showPreviousConversationsOptionsScreen: action.showChatOptionsScreen,
			};
		}

		case SET_INPUT_MODE: {
			return {
				...state,
				inputMode: action.inputMode,
			};
		}

		case SET_FULLSCREEN_MESSAGE: {
			return {
				...state,
				fullscreenMessage: action.fullscreenMessage,
			};
		}

		case SET_AGENT_AVATAR_OVERRIDE_URL: {
			return {
				...state,
				agentAvatarOverrideUrl: action.url,
			};
		}

		case SET_BOT_AVATAR_OVERRIDE_URL: {
			return {
				...state,
				botAvatarOverrideUrl: action.url,
			};
		}

		case SET_PAGE_VISIBLE: {
			return {
				...state,
				isPageVisible: action.visible,
			};
		}

		case SET_HAS_ACCEPTED_TERMS: {
			return {
				...state,
				hasAcceptedTerms: true,
			};
		}

		case SET_STORED_MESSAGE: {
			return {
				...state,
				storedMessage: action.message,
			};
		}

		case SET_TTS_ACTIVE: {
			return {
				...state,
				ttsActive: action.active,
			};
		}

		case SET_LAST_INPUT_ID: {
			return {
				...state,
				lastInputId: action.id,
			};
		}
	}

	return state;
};
