import { Reducer } from "redux";
import { IMessage } from "../../../common/interfaces/message";
import { RatingState } from "../rating/rating-reducer";
import { IMessageEvent } from "../../../common/interfaces/event";

export type PrevConversationsState = {
	[key: string]:
		| {
				messages: (IMessage | IMessageEvent)[];
				rating: RatingState;
		  }
		| undefined;
};

const getInitialState = (): PrevConversationsState => ({});

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
			return { ...state, [sessionId]: undefined };
		}

		default:
			return state;
	}
};
