import { Middleware } from "redux";
import { StoreState } from "../store";
import { clearUnseenMessages } from "../unseen-messages/unseen-message-reducer";
import {
	setOpen,
	ToggleOpenAction,
	ShowChatScreenAction,
	SetPageVisibleAction,
	SetHasAcceptedTermsAction,
	SetHasAcceptedSystemUseNotificationAction,
	SetOpenAction,
} from "./ui-reducer";
import { getStorage } from "../../helper/storage";
import {
	setHasAcceptedTermsInStorage,
	setHasAcceptedSunInStorage,
	hasAcceptedSunInStorage,
} from "../../helper/privacyPolicy";
import { setHasAcceptedSystemUseNotification, completeDeferredSessionSwitch } from "./ui-reducer";
import { SwitchSessionAction } from "../previous-conversations/previous-conversations-reducer";

/**
 * True when SUN is enabled, the current session's notice has been accepted, and the
 * user has not sent a message in that session yet. Such an acceptance carries over
 * to the next session (CGY-45543). Bot and engagement messages don't count: only a
 * user message — including the getStarted auto-inject — makes the session "used".
 */
function isAcceptedSessionUnused(state: StoreState): boolean {
	if (!state.config.settings?.systemUseNotification?.enabled) return false;
	if (!state.ui.hasAcceptedSystemUseNotification) return false;

	return !state.messages.messageHistory?.some(message => message.source === "user");
}

export const uiMiddleware: Middleware<object, StoreState> =
	store =>
	next =>
	(
		action:
			| ToggleOpenAction
			| SetOpenAction
			| ShowChatScreenAction
			| SetPageVisibleAction
			| SetHasAcceptedTermsAction
			| SetHasAcceptedSystemUseNotificationAction
			| SwitchSessionAction,
	) => {
		const { disableLocalStorage, useSessionStorage } =
			store.getState().config.settings.embeddingConfiguration;
		const browserStorage = getStorage({ useSessionStorage, disableLocalStorage });

		switch (action.type) {
			case "TOGGLE_OPEN": {
				const open = store.getState().ui.open;

				store.dispatch(setOpen(!open));

				break;
			}

			case "SET_OPEN": {
				const { open } = action;

				// We determine if the chat history is visible by other screens visibility.
				const { showHomeScreen, showPrevConversations, showChatOptionsScreen } =
					store.getState().ui;

				const isChatHistoryVisible =
					!showPrevConversations && !showChatOptionsScreen && !showHomeScreen;

				if (open && isChatHistoryVisible) {
					store.dispatch(clearUnseenMessages());
				}
				break;
			}

			// if the chat screen is opened while the page is active, reset unread messages
			case "SHOW_CHAT_SCREEN": {
				if (store.getState().ui.isPageVisible) {
					store.dispatch(clearUnseenMessages());
				}

				break;
			}

			// if the page gets active while the webchat is open, reset unread messages
			case "SET_PAGE_VISIBLE": {
				if (action.visible && store.getState().ui.open) {
					store.dispatch(clearUnseenMessages());
				}

				break;
			}

			// if the User accepts the privacy notice, we store it in local storage mapped to the user id
			case "SET_HAS_ACCEPTED_TERMS": {
				if (browserStorage) {
					setHasAcceptedTermsInStorage(browserStorage, action.userId);
				}

				break;
			}

			// System Use Notification (AC-8 / FedRAMP) — store accepted sessionId and
			// complete any deferred session switch that was waiting for acceptance.
			case "SET_HAS_ACCEPTED_SYSTEM_USE_NOTIFICATION": {
				// Read the pending switch BEFORE next() — the reducer clears it afterward.
				const pendingSwitch = store.getState().ui.pendingSessionSwitch;

				if (browserStorage) {
					// A carried-over acceptance for a brand-new session has no sessionId yet
					// (socket-client generates it on switch); don't overwrite storage with "".
					if (action.sessionId) {
						setHasAcceptedSunInStorage(browserStorage, action.sessionId);
					}
					// Also record the target session so page-reloads within that session skip the notice.
					if (pendingSwitch?.sessionId) {
						setHasAcceptedSunInStorage(browserStorage, pendingSwitch.sessionId);
					}
				}

				const result = next(action);

				// Complete the deferred socket switch now that SUN is accepted.
				if (pendingSwitch) {
					store.dispatch(
						completeDeferredSessionSwitch(
							pendingSwitch.sessionId,
							pendingSwitch.conversation,
						),
					);
				}

				return result;
			}
		}

		// Read before next(): the reducer resets hasAcceptedSystemUseNotification on SWITCH_SESSION.
		const carryOverSunAcceptance =
			action.type === "SWITCH_SESSION" && isAcceptedSessionUnused(store.getState());

		// Run the reducer (and all downstream middleware) first so the state is updated.
		const result = next(action);

		// After SWITCH_SESSION the reducer has reset hasAcceptedSystemUseNotification to false.
		if (action.type === "SWITCH_SESSION") {
			if (action.sessionId && hasAcceptedSunInStorage(browserStorage, action.sessionId)) {
				// The incoming sessionId was already accepted in a prior page visit (e.g. the
				// user returns to an existing conversation): restore the acceptance so the
				// notice does not re-appear for that session.
				store.dispatch(setHasAcceptedSystemUseNotification(action.sessionId));
			} else if (carryOverSunAcceptance) {
				// The user accepted the notice for the session they are leaving but never
				// sent a message in it (e.g. accepted on Previous conversations, then clicked
				// "Start new conversation"). Carry the acceptance over instead of asking
				// twice: they have seen and accepted the notice before any interaction.
				store.dispatch(setHasAcceptedSystemUseNotification(action.sessionId || ""));
			}
		}

		return result;
	};
