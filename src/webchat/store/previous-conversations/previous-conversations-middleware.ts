import { Dispatch, Middleware, MiddlewareAPI } from "redux";
import { v4 as uuidv4 } from "uuid";
import { StoreState } from "../store";
import { SwitchSessionAction, upsertPrevConversation } from "./previous-conversations-reducer";
import {
	sendMessage,
	SendMessageAction,
	TriggerEngagementMessageAction,
} from "../messages/message-middleware";
import { ReceiveMessageAction } from "../messages/message-handler";
import { RatingAction, ratingInitialState } from "../rating/rating-reducer";
import { SetPrevStateAction, setPrevState } from "../reducer";
import { SocketClient } from "@cognigy/socket-client";
import {
	autoInjectHandledReset,
	autoInjectRearm,
	triggerAutoInject,
} from "../autoinject/autoinject-reducer";
import { setConnecting } from "../connection/connection-reducer";
import { setOptions } from "../options/options-reducer";
import {
	CompleteDeferredSessionSwitchAction,
	setPendingSessionSwitch,
	setStoredMessage,
} from "../ui/ui-reducer";

type Actions =
	| SwitchSessionAction
	| CompleteDeferredSessionSwitchAction
	| SetPrevStateAction
	| SendMessageAction
	| ReceiveMessageAction
	| TriggerEngagementMessageAction
	| RatingAction;

export const createPrevConversationsMiddleware =
	(client: SocketClient): Middleware<object, StoreState> =>
	store =>
	next =>
	(action: Actions) => {
		switch (action.type) {
			case "SWITCH_SESSION": {
				const { sessionId, conversation, deferConnection } = action;

				const targetSession = sessionId || "";
				const targetConversation = conversation ||
					store.getState().prevConversations?.[targetSession] || {
						messages: [],
						rating: ratingInitialState,
					};

				// Switch without connecting (Delete All, CGY-39639). This never connects, so it
				// doesn't bypass SUN: the notice gates the connection when the user starts a
				// conversation. Checked before the SUN deferral, which would connect on accept.
				if (deferConnection) {
					prepareSession(client, store.dispatch, targetSession, targetConversation);
					break;
				}

				// If SUN is enabled, always defer the socket switch until the user accepts
				// the notice for the target session. Do not consult
				// ui.hasAcceptedSystemUseNotification here: this middleware runs before the
				// ui reducer resets it on SWITCH_SESSION, so it still reflects the previous
				// session. If the target session was already accepted, ui-middleware restores
				// the acceptance from storage after the reducer runs, which completes the
				// deferred switch immediately.
				const sunEnabled =
					!!store.getState().config.settings?.systemUseNotification?.enabled;
				if (sunEnabled) {
					store.dispatch(setPendingSessionSwitch(targetSession, targetConversation));
					break;
				}

				doSwitchSession(client, store, targetSession, targetConversation);
				break;
			}

			// Completes a session switch that was deferred pending SUN acceptance.
			// Dispatched by ui-middleware once SET_HAS_ACCEPTED_SYSTEM_USE_NOTIFICATION fires.
			case "COMPLETE_DEFERRED_SESSION_SWITCH": {
				const { sessionId, conversation } = action;
				doSwitchSession(client, store, sessionId, conversation);
				break;
			}
			case "SEND_MESSAGE":
			case "RECEIVE_MESSAGE":
			case "TRIGGER_ENGAGEMENT_MESSAGE":
			case "SHOW_RATING_SCREEN":
			case "SET_HAS_GIVEN_RATING":
			case "SET_CUSTOM_RATING_TITLE":
			case "SET_CUSTOM_RATING_COMMENT_TEXT": {
				const currentSession = store.getState().options.sessionId;
				if (!currentSession) break;

				const conversation = {
					messages: store.getState().messages.messageHistory,
					rating: store.getState().rating,
				};
				store.dispatch(upsertPrevConversation(currentSession, conversation));
				break;
			}
		}

		return next(action);
	};

/** Performs the actual socket switch and triggers auto-inject. Shared by both the
 * immediate path (SUN not pending) and the deferred path (after SUN acceptance). */
function doSwitchSession(
	client: SocketClient,
	store: MiddlewareAPI<Dispatch, StoreState>,
	targetSession: string,
	targetConversation: Parameters<typeof setPrevState>[0],
) {
	const { dispatch } = store;
	dispatch(setPrevState(targetConversation));
	dispatch(setConnecting(true));
	client
		.switchSession(targetSession)
		.then(() => {
			dispatch(setConnecting(false));
			// A conversation starter clicked while the switch was deferred for SUN is
			// queued as storedMessage; send it now that the socket is on the target session.
			// Sent before auto-inject, which then skips because the history is not empty.
			const { storedMessage } = store.getState().ui;
			if (storedMessage) {
				dispatch(
					sendMessage(
						{ text: storedMessage.text, data: storedMessage.data },
						storedMessage.options,
					),
				);
				dispatch(setStoredMessage(null));
			}
			dispatch(setOptions(client.socketOptions));
			dispatch(autoInjectHandledReset());
			dispatch(triggerAutoInject());
		})
		.catch(() => {
			// TODO: should we do something else if switching connection goes wrong?
			dispatch(setConnecting(false));
		});
}

/** Switches to a session without connecting the socket: the endpoint only learns
 * about the session once the user starts a conversation, which connects (CONNECT
 * on SHOW_CHAT_SCREEN / SEND_MESSAGE) and sends the re-armed auto-inject message.
 * Connecting here would start a session nobody asked for (CGY-39639). */
function prepareSession(
	client: SocketClient,
	dispatch: Dispatch,
	targetSession: string,
	targetConversation: Parameters<typeof setPrevState>[0],
) {
	client.disconnect();
	// Same fallback as client.switchSession() for when randomUUID is unavailable.
	client.socketOptions.sessionId = targetSession || `session-${uuidv4()}`;
	dispatch(setPrevState(targetConversation));
	dispatch(setOptions(client.socketOptions));
	dispatch(autoInjectRearm());
}
