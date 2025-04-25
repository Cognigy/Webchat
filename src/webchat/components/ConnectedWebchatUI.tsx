import { WebchatUI, WebchatUIProps } from "../../webchat-ui";
import { connect } from "react-redux";
import { StoreState } from "../store/store";
import { sendMessage, triggerEngagementMessage } from "../store/messages/message-middleware";
import {
	setInputMode,
	setFullscreenMessage,
	setOpen,
	toggleOpen,
	setShowHomeScreen,
	showChatScreen,
	setShowPrevConversations,
	setShowChatOptionsScreen,
	setHasAcceptedTerms,
	UIState,
	setStoredMessage,
	setMinimize,
} from "../store/ui/ui-reducer";
import { getPluginsForMessage, isFullscreenPlugin } from "../../plugins/helper";
import { connect as doConnect } from "../store/connection/connection-middleware";
import { setHasGivenRating, showRatingScreen } from "../store/rating/rating-reducer";
import { switchSession } from "../store/previous-conversations/previous-conversations-middleware";
import { PrevConversationsState } from "../store/previous-conversations/previous-conversations-reducer";
import {
	IFile,
	setDropZoneVisible,
	setFileList,
	setFileUploadError,
} from "../store/input/input-reducer";
import { openOverlay } from "../store/xapp-overlay/slice";
import { IStreamingMessage } from "../../common/interfaces/message";
import { setMessageAnimated } from "../store/messages/message-reducer";

type FromState = Pick<
	WebchatUIProps,
	| "messages"
	| "unseenMessages"
	| "prevConversations"
	| "open"
	| "typingIndicator"
	| "inputMode"
	| "fullscreenMessage"
	| "config"
	| "connected"
	| "reconnectionLimit"
>;

type FromDispatch = Pick<
	WebchatUIProps,
	| "onSendMessage"
	| "onSetInputMode"
	| "onSetFullscreenMessage"
	| "onDismissFullscreenMessage"
	| "onClose"
	| "onToggle"
	| "onTriggerEngagementMessage"
	| "onSetMessageAnimated"
>;

export type FromProps = Pick<
	WebchatUIProps,
	"messagePlugins" | "inputPlugins" | "webchatRootProps" | "webchatToggleProps" | "options"
>;

type Merge = FromState & FromDispatch & FromProps & Pick<WebchatUIProps, "fullscreenMessage">;

export const ConnectedWebchatUI = connect<FromState, FromDispatch, FromProps, Merge, StoreState>(
	(state: StoreState) => {
		const {
			messages: { messageHistory: messages, visibleOutputMessages },
			unseenMessages,
			prevConversations,
			connection: { connected, reconnectionLimit },
			ui: {
				open,
				typing,
				inputMode,
				fullscreenMessage,
				showHomeScreen,
				showPrevConversations,
				showChatOptionsScreen,
				hasAcceptedTerms,
				ttsActive,
				lastInputId,
			},
			config,
			options: { sessionId, userId },
			rating: {
				showRatingScreen,
				hasGivenRating,
				requestRatingScreenTitle,
				customRatingTitle,
				customRatingCommentText,
				requestRatingSubmitButtonText,
				requestRatingEventBannerText,
				requestRatingChatStatusBadgeText,
			},
			input: { sttActive, isDropZoneVisible, fileList, fileUploadError },
			xAppOverlay: { open: isXAppOverlayOpen },
		} = state;

		return {
			currentSession: sessionId,
			messages,
			visibleOutputMessages,
			unseenMessages,
			prevConversations,
			open,
			typingIndicator: typing,
			inputMode,
			fullscreenMessage,
			config,
			connected,
			reconnectionLimit,
			showRatingScreen,
			hasGivenRating,
			requestRatingScreenTitle,
			customRatingTitle,
			customRatingCommentText,
			requestRatingSubmitButtonText,
			requestRatingEventBannerText,
			requestRatingChatStatusBadgeText,
			showHomeScreen,
			sttActive,
			isDropZoneVisible,
			fileList,
			fileUploadError,
			showPrevConversations,
			showChatOptionsScreen,
			hasAcceptedTerms,
			isXAppOverlayOpen,
			userId,
			ttsActive,
			lastInputId,
		} as FromState;
	},
	dispatch => ({
		onSendMessage: (text, data, options) => dispatch(sendMessage({ text, data }, options)),
		onSetInputMode: inputMode => dispatch(setInputMode(inputMode)),
		onSetFullscreenMessage: message => dispatch(setFullscreenMessage(message)),
		onDismissFullscreenMessage: () => dispatch(setFullscreenMessage(undefined)),
		onClose: () => dispatch(setOpen(false)),
		onMinimize: () => dispatch(setMinimize()),
		onToggle: () => dispatch(toggleOpen()),
		onTriggerEngagementMessage: () => dispatch(triggerEngagementMessage()),
		onConnect: () => dispatch(doConnect()),
		onShowRatingScreen: (show: boolean) => dispatch(showRatingScreen(show)),
		onSetHasGivenRating: () => dispatch(setHasGivenRating()),
		onSetShowHomeScreen: (show: boolean) => dispatch(setShowHomeScreen(show)),
		onSetShowPrevConversations: (show: boolean) => dispatch(setShowPrevConversations(show)),
		onSetShowChatOptionsScreen: (show: boolean) => dispatch(setShowChatOptionsScreen(show)),
		onShowChatScreen: () => dispatch(showChatScreen()),
		onSwitchSession: (sessionId?: string, conversation?: PrevConversationsState[string]) =>
			dispatch(switchSession(sessionId, conversation)),
		onAcceptTerms: (userId: string) => dispatch(setHasAcceptedTerms(userId)),
		onSetStoredMessage: (message: UIState["storedMessage"]) =>
			dispatch(setStoredMessage(message)),
		onSetDropZoneVisible: (isVisible: boolean) => dispatch(setDropZoneVisible(isVisible)),
		onSetFileList: (fileList: IFile[]) => dispatch(setFileList(fileList)),
		onSetFileUploadError: (error: boolean) => dispatch(setFileUploadError(error)),
		openXAppOverlay: (url: string) => dispatch(openOverlay(url)),
		onSetMessageAnimated: (
			messageId: string,
			animationState: IStreamingMessage["animationState"],
		) => dispatch(setMessageAnimated(messageId, animationState)),
	}),
	({ fullscreenMessage, ...state }, dispatch, props) => {
		if (!fullscreenMessage) {
			const lastMessage = state.messages.slice(-1)[0];

			const matchedPlugins = lastMessage
				? getPluginsForMessage(props.messagePlugins || [], state.config)(lastMessage)
				: [];

			const lastPlugin = matchedPlugins.slice(-1)[0];

			fullscreenMessage =
				lastPlugin && isFullscreenPlugin(lastPlugin) ? lastMessage : undefined;
		}

		return {
			...state,
			...dispatch,
			...props,
			fullscreenMessage,
		};
	},
)(WebchatUI);
