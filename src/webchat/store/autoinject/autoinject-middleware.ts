import { Middleware } from "redux";
import { StoreState } from "../store";
import { autoInjectHandled, TAutoInjectAction, triggerAutoInject } from "./autoinject-reducer";
import { Webchat } from "../../components/Webchat";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";
import getMessagesListWithoutControlCommands from "../../../webchat-ui/utils/filter-out-control-commands";

export const createAutoInjectMiddleware =
	(webchat: Webchat): Middleware<unknown, StoreState> =>
	api =>
	next =>
	(action: TAutoInjectAction) => {
		switch (action.type) {
			case "SET_CONFIG":
			case "SET_CONNECTED":
			case "SHOW_CHAT_SCREEN":
			case "SET_OPTIONS": {
				const nextActionResult = next(action);

				(() => {
					const state = api.getState();
					const {
						isAutoInjectHandled: isAutoInjectTriggered,
						isConfiguredOnce,
						isConnectedOnce,
						isChatOpenedOnce,
						isSessionRestoredOnce,
					} = state.autoInject;

					if (isAutoInjectTriggered) return;

					if (
						!isConfiguredOnce ||
						!isConnectedOnce ||
						!isChatOpenedOnce ||
						!isSessionRestoredOnce
					)
						return;

					api.dispatch(triggerAutoInject());
				})();

				return nextActionResult;
			}

			case "TRIGGER_AUTO_INJECT": {
				const state = api.getState();
				const config = state.config as IWebchatConfig;

				// Now is the time to handle the "auto-inject message" (if configured)

				// This should be handled just once, so let's trigger it to be handled!
				api.dispatch(autoInjectHandled());

				// Don't send a message if "startBehavior" is not set to "injection"
				if (config.settings.startBehavior.startBehavior !== "injection") {
					break;
				}

				// Don't trigger the auto inject message when the history is not empty
				// except if explicitly set via enableInjectionWithoutEmptyHistory
				if (!config.settings.widgetSettings.enableInjectionWithoutEmptyHistory) {
					// If there are stored messages waiting to be sent, don't send the auto-inject message
					if(state.ui.storedMessage) {
						break;
					}

					// Exclude engagement messages from state.messages
					const messagesExcludingEngagementMessages = state.messages?.filter(
						message => message.source !== "engagement",
					);
					// Exclude controlCommands messages from filtered message list
					const messagesExcludingControlCommands = getMessagesListWithoutControlCommands(
						messagesExcludingEngagementMessages,
					);
					const isEmptyExceptEngagementAndControlCommands =
						messagesExcludingControlCommands.length === 0;

					if (!isEmptyExceptEngagementAndControlCommands) {
						break;
					}
				}

				// We are going to send the auto-inject message, now!
				const text = state.config.settings.startBehavior.getStartedPayload;
				const data = state.config.settings.startBehavior.getStartedData;
				const label = state.config.settings.startBehavior.getStartedText;

				webchat.sendMessage(text, data, { label });
				break;
			}
		}

		return next(action);
	};
