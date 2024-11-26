import { Middleware } from "redux";
import { StoreState } from "../store";
import { PrevConversationsState, upsertPrevConversation } from "./previous-conversations-reducer";
import { SendMessageAction, TriggerEngagementMessageAction } from "../messages/message-middleware";
import { ReceiveMessageAction } from "../messages/message-handler";
import { RatingAction, ratingInitialState } from "../rating/rating-reducer";
import { SetPrevStateAction, setPrevState } from "../reducer";
import { SocketClient } from "@cognigy/socket-client";
import { autoInjectHandledReset, triggerAutoInject } from "../autoinject/autoinject-reducer";
import { setConnecting } from "../connection/connection-reducer";
import { setOptions } from "../options/options-reducer";

const SWITCH_SESSION = "SWITCH_SESSION";
export const switchSession = (
	sessionId?: string,
	conversation?: PrevConversationsState[string],
) => ({
	type: SWITCH_SESSION as "SWITCH_SESSION",
	sessionId,
	conversation,
});
export type SwitchSessionAction = ReturnType<typeof switchSession>;

type Actions =
	| SwitchSessionAction
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
				const { sessionId, conversation } = action;

				const targetSession = sessionId || (self.crypto as any)?.randomUUID?.() || "";
				const targetConversation = conversation ||
					store.getState().prevConversations?.[targetSession] || {
						messages: [],
						rating: ratingInitialState,
					};

				store.dispatch(setPrevState(targetConversation));
				store.dispatch(setConnecting(true));
				client
					.switchSession(targetSession)
					.then(() => {
						store.dispatch(setConnecting(false));
						store.dispatch(setOptions(client.socketOptions));
						store.dispatch(autoInjectHandledReset());
						store.dispatch(triggerAutoInject());
					})
					.catch(() => {
						// TODO: should we do something else if switching connection goes wrong?
						store.dispatch(setConnecting(false));
					});
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
					messages: store.getState().messages,
					rating: store.getState().rating,
				};
				store.dispatch(upsertPrevConversation(currentSession, conversation));
				break;
			}
		}

		return next(action);
	};
