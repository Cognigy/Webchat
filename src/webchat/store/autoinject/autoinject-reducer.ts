import { Reducer } from "redux";
import { SetConfigAction } from "../config/config-reducer";
import { SetConnectedAction } from "../connection/connection-reducer";
import { SetOptionsAction } from "../options/options-reducer";
import { ShowChatScreenAction } from "../ui/ui-reducer";

const getInitialState = () => ({
	isChatOpenedOnce: false,
	isConnectedOnce: false,
	isConfiguredOnce: false,
	isSessionRestoredOnce: false,
	isAutoInjectHandled: false,
});

export type TAutoInjectState = ReturnType<typeof getInitialState>;

const TRIGGER_AUTO_INJECT = "TRIGGER_AUTO_INJECT";
export const triggerAutoInject = () => ({
	type: TRIGGER_AUTO_INJECT as "TRIGGER_AUTO_INJECT",
});
export type TTriggerAutoInjectAction = ReturnType<typeof triggerAutoInject>;

const AUTO_INJECT_HANDLED = "AUTO_INJECT_HANDLED";
export const autoInjectHandled = () => ({
	type: AUTO_INJECT_HANDLED as "AUTO_INJECT_HANDLED",
});
export type TAutoInjectTriggeredAction = ReturnType<typeof autoInjectHandled>;

const AUTO_INJECT_HANDLED_RESET = "AUTO_INJECT_HANDLED_RESET";
export const autoInjectHandledReset = () => ({
	type: AUTO_INJECT_HANDLED_RESET as "AUTO_INJECT_HANDLED_RESET",
});
export type TAutoInjectResetAction = ReturnType<typeof autoInjectHandledReset>;

/**
 * Re-arms the auto-inject message for a session that is not connected yet:
 * like on a fresh page load, it is sent once the chat screen is shown again.
 */
const AUTO_INJECT_REARM = "AUTO_INJECT_REARM";
export const autoInjectRearm = () => ({
	type: AUTO_INJECT_REARM as "AUTO_INJECT_REARM",
});
export type TAutoInjectRearmAction = ReturnType<typeof autoInjectRearm>;

export type TAutoInjectAction =
	| SetConnectedAction
	| ShowChatScreenAction
	| SetOptionsAction
	| SetConfigAction
	| TTriggerAutoInjectAction
	| TAutoInjectTriggeredAction
	| TAutoInjectResetAction
	| TAutoInjectRearmAction;

/**
 * This reducer collects and manages information about
 * - whether the auto-inject message is ready to be sent
 * - whether the auto-inject message has been sent already
 */
export const autoInject: Reducer<TAutoInjectState, TAutoInjectAction> = (
	state = getInitialState(),
	action,
) => {
	switch (action.type) {
		case "SET_CONNECTED": {
			if (action.connected && !state.isConnectedOnce) {
				return {
					...state,
					isConnectedOnce: true,
				};
			}

			break;
		}

		case "SHOW_CHAT_SCREEN": {
			if (!state.isChatOpenedOnce) {
				return {
					...state,
					isChatOpenedOnce: true,
				};
			}

			break;
		}

		case "SET_CONFIG": {
			if (!state.isConfiguredOnce) {
				return {
					...state,
					isConfiguredOnce: true,
				};
			}

			break;
		}

		case "SET_OPTIONS": {
			if (!state.isSessionRestoredOnce) {
				return {
					...state,
					isSessionRestoredOnce: true,
				};
			}

			break;
		}

		case "AUTO_INJECT_HANDLED": {
			if (!state.isAutoInjectHandled) {
				return {
					...state,
					isAutoInjectHandled: true,
				};
			}

			break;
		}

		case "AUTO_INJECT_HANDLED_RESET": {
			if (state.isAutoInjectHandled) {
				return {
					...state,
					isAutoInjectHandled: false,
				};
			}

			break;
		}

		case "AUTO_INJECT_REARM": {
			return {
				...state,
				isChatOpenedOnce: false,
				isAutoInjectHandled: false,
			};
		}
	}

	return state;
};
