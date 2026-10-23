import { Reducer } from "redux";
import { IMessage } from "../../../common/interfaces/message";
import { RatingState } from "../rating/rating-reducer";
import { IMessageEvent } from "../../../common/interfaces/event";

export type PrevConversationsState = {
	[key: string]: {
		messages: (IMessage | IMessageEvent)[];
		rating: RatingState;
	};
};

const getInitialState = (): PrevConversationsState => ({});

const SWITCH_SESSION = "SWITCH_SESSION";
/**
 * @param deferConnection when true, the session id is switched but the socket
 * is left disconnected (see `switchToUnconnectedSession`).
 */
export const switchSession = (
	sessionId = (self.crypto as any)?.randomUUID?.(),
	conversation?: PrevConversationsState[string],
	deferConnection = false,
) => ({
	type: SWITCH_SESSION as "SWITCH_SESSION",
	sessionId,
	conversation,
	deferConnection,
});
/**
 * Switches to a new, empty session without connecting the socket: no session is
 * started on the endpoint and no auto-inject message is sent until the user
 * starts a conversation. Used by "Delete all conversations", which must not
 * create a new session (CGY-39639).
 */
export const switchToUnconnectedSession = () => switchSession(undefined, undefined, true);
export type SwitchSessionAction = ReturnType<typeof switchSession>;

const SET_CONVERSATIONS = "SET_CONVERSATIONS" as const;
export const setConversations = (conversations: PrevConversationsState) => ({
	type: SET_CONVERSATIONS,
	conversations,
});
export type SetConversationsAction = ReturnType<typeof setConversations>;

const UPSERT_PREV_CONVERSATION = "UPSERT_PREV_CONVERSATION" as const;
export const upsertPrevConversation = (
	sessionId: string,
	conversation: PrevConversationsState[string],
) => ({
	type: UPSERT_PREV_CONVERSATION,
	sessionId,
	conversation,
});
export type UpsertPrevConversation = ReturnType<typeof upsertPrevConversation>;

const DELETE_PREV_CONVERSATION = "DELETE_PREV_CONVERSATION" as const;
export const deletePrevConversation = (sessionId: string) => ({
	type: DELETE_PREV_CONVERSATION,
	sessionId,
});
export type DeletePrevConversation = ReturnType<typeof deletePrevConversation>;

export const prevConversations: Reducer<
	PrevConversationsState,
	SetConversationsAction | UpsertPrevConversation | DeletePrevConversation
> = (state = getInitialState(), action) => {
	switch (action.type) {
		case SET_CONVERSATIONS: {
			return action.conversations;
		}

		case UPSERT_PREV_CONVERSATION: {
			const { sessionId, conversation } = action;
			return { ...state, [sessionId]: conversation };
		}
		case DELETE_PREV_CONVERSATION: {
			const { sessionId } = action;
			delete state[sessionId];
			return state;
		}

		default:
			return state;
	}
};
