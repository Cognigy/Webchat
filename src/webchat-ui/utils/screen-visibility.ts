import { IWebchatConfig } from "../../common/interfaces/webchat-config";

interface ScreenVisibilityProps {
	config: IWebchatConfig;
	showHomeScreen: boolean;
	showChatOptionsScreen: boolean;
	showRatingScreen: boolean;
	showPrevConversations: boolean;
	hasAcceptedTerms: boolean;
}

/**
 * Which primary view the open chat window shows. Single source for the
 * screen announcers and renderRegularLayout's layout decisions in
 * WebchatUI — the chat screen is the fallback when no other screen claims
 * the view. (`showInformationMessage` in renderRegularLayout is truthy
 * iff `isInforming`: every inform branch has fallback text.)
 */
export function getScreenVisibility(props: ScreenVisibilityProps, isInforming: boolean) {
	const {
		config,
		showHomeScreen,
		showChatOptionsScreen,
		showRatingScreen,
		showPrevConversations,
		hasAcceptedTerms,
	} = props;

	const showEnabledHomeScreen = !!(config.settings.homeScreen.enabled && showHomeScreen);
	const showHomeScreenView = showEnabledHomeScreen && !isInforming;
	const showChatScreen =
		!isInforming &&
		!showEnabledHomeScreen &&
		!showChatOptionsScreen &&
		!showRatingScreen &&
		!showPrevConversations &&
		(hasAcceptedTerms || !config.settings.privacyNotice.enabled);

	return { showEnabledHomeScreen, showHomeScreenView, showChatScreen };
}
