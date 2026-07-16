import { Middleware } from "redux";
import { StoreState } from "../store";
import { SetConnectedAction } from "../connection/connection-reducer";
import { SendMessageAction, SetUserTypingAction } from "../messages/message-middleware";
import { Webchat } from "../../components/Webchat";

export const USER_INACTIVE_EVENT = "webchat/user-inactive";
const DEFAULT_TIMEOUT = 120_000; // 2 minutes

type UserInactivityAction = SetConnectedAction | SendMessageAction | SetUserTypingAction;

/**
 * Messages sent through the documented analytics-forwarding pattern
 * (`webchat.sendMessage("", { analyticsEvent: event.type, ... })`) are
 * programmatic notifications, not user responses. Treating them as user
 * activity would re-arm the inactivity timer and make the event fire in an
 * endless loop for an abandoned chat.
 */
const isAnalyticsForwardMessage = (action: SendMessageAction) =>
	!action.message.text && !!(action.message.data as { analyticsEvent?: string })?.analyticsEvent;

/**
 * Emits the `webchat/user-inactive` analytics event when the webchat is
 * connected and the user has not been active for the configured timeout
 * (`settings.widgetSettings.userInactivity`, opt-in).
 *
 * User activity is an outgoing message or typing in the input; incoming
 * bot/agent messages do not count. The timer starts when the connection is
 * established, is cancelled on disconnect, and the event fires at most once
 * per inactivity period — new user activity arms the detection again.
 */
export const createUserInactivityMiddleware = (
	webchat: Webchat,
): Middleware<object, StoreState> => {
	let timer: ReturnType<typeof setTimeout> | null = null;

	return store => {
		const clearTimer = () => {
			if (timer !== null) {
				clearTimeout(timer);
				timer = null;
			}
		};

		const armTimer = () => {
			clearTimer();

			// read the settings at arm time so runtime updates via
			// webchat.updateSettings() apply to the next period
			const { enabled, timeout } =
				store.getState().config.settings.widgetSettings.userInactivity ?? {};
			if (!enabled) return;

			const effectiveTimeout =
				typeof timeout === "number" && timeout > 0 ? timeout : DEFAULT_TIMEOUT;
			const lastActivityAt = Date.now();

			timer = setTimeout(() => {
				timer = null;

				// the connection may have dropped without a SET_CONNECTED making it
				// through this middleware, so re-check at fire time
				if (!store.getState().connection.connected) return;

				webchat.emitAnalytics(USER_INACTIVE_EVENT, {
					timeout: effectiveTimeout,
					inactiveSince: new Date(lastActivityAt).toISOString(),
				});
			}, effectiveTimeout);
		};

		return next => (action: UserInactivityAction) => {
			switch (action.type) {
				case "SET_CONNECTED": {
					if (action.connected) {
						armTimer();
					} else {
						clearTimer();
					}
					break;
				}

				case "SEND_MESSAGE": {
					if (!isAnalyticsForwardMessage(action)) {
						armTimer();
					}
					break;
				}

				case "SET_USER_TYPING": {
					if (action.typing && store.getState().connection.connected) {
						armTimer();
					}
					break;
				}
			}

			return next(action);
		};
	};
};
