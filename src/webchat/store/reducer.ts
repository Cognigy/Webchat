import { combineReducers } from "redux";
import { options } from "./options/options-reducer";
import { createMessageReducer } from "./messages/message-reducer";
import { ui } from "./ui/ui-reducer";
import { config } from "./config/config-reducer";
import { connection } from "./connection/connection-reducer";
import { unseenMessages } from "./unseen-messages/unseen-message-reducer";
import { autoInject } from "./autoinject/autoinject-reducer";
import { rating } from "./rating/rating-reducer";
import { inputCollation } from "./input-collation/input-collation-reducer";
import { input } from "./input/input-reducer";
import {
	PrevConversationsState,
	prevConversations,
} from "./previous-conversations/previous-conversations-reducer";
import { StoreState } from "./store";
import xAppOverlay from "./xapp-overlay/slice";
import queueUpdates from "./queue-updates/slice";
import userTyping from "./typing/slice";

const rootReducer = (state, action) => {
	const combinedReducer = combineReducers({
		messages: createMessageReducer(() => state),
		unseenMessages,
		options,
		config,
		autoInject,
		rating,
		ui,
		connection,
		inputCollation,
		input,
		prevConversations,
		xAppOverlay,
		queueUpdates,
		userTyping,
	});
	return combinedReducer(state, action);
};

const RESET_STATE = "RESET_STATE";
export const resetState = (state?: StoreState) => ({
	type: RESET_STATE as "RESET_STATE",
	state,
});
export type ResetStateAction = ReturnType<typeof resetState>;

const SET_PREV_STATE = "SET_PREV_STATE";
export const setPrevState = (state: PrevConversationsState[string]) => ({
	type: SET_PREV_STATE as "SET_PREV_STATE",
	state,
});
export type SetPrevStateAction = ReturnType<typeof setPrevState>;

export const reducer = (state = rootReducer(undefined, { type: "" }), action) => {
	switch (action.type) {
		// This is actually "Restore persisted history"
		case "RESET_STATE": {
			// To avoid duplicate messages in chat history during re-connection, we only restore messages and prepend them if the current message history is empty
			const isEmptyHistory =
				state.messages.messageHistory.length === 0 ||
				(state.messages.messageHistory.length === 1 &&
					state.messages.messageHistory[0].source === "engagement");
			const messages = isEmptyHistory ? action.state.messages : [];
			// Mark restored bot/engagement messages animationState as done

			const restoredMessages = messages.map(message => {
				if (
					(message.source === "bot" || message.source === "engagement") &&
					"animationState" in message &&
					message.animationState &&
					message.animationState !== "done"
				) {
					return { ...message, animationState: "done" };
				}
				return message;
			});
			// Build updated visibleOutputMessages including restored bot/engagement messages
			const restoredVisibleOutputMessages = state.messages.visibleOutputMessages.slice();
			if (restoredMessages.length) {
				for (const m of restoredMessages) {
					if (
						(m.source === "bot" || m.source === "engagement") &&
						m.id &&
						!restoredVisibleOutputMessages.includes(m.id as string)
					) {
						restoredVisibleOutputMessages.push(m.id as string);
					}
				}
			}
			return rootReducer(
				{
					...state,
					messages: {
						messageHistory: [...restoredMessages, ...state.messages.messageHistory],
						visibleOutputMessages: restoredVisibleOutputMessages,
					},
					rating: {
						...state.rating,
						hasGivenRating: action.state.rating.hasGivenRating,
					},
				},
				{ type: "" },
			);
		}

		case "SET_PREV_STATE": {
			const { showRatingScreen, ...rating } = action.state.rating;
			const visibleOutputMessages = [];
			const messages = action.state.messages.map(message => {
				if (message.animationState) {
					message.animationState = "done";
				}
				if ((message.source === "bot" || message.source === "engagement") && message.id) {
					visibleOutputMessages.push(message.id as string);
				}
				return message;
			});
			return rootReducer(
				{
					...state,
					messages: {
						messageHistory: [...messages],
						visibleOutputMessages,
					},
					rating: { showRatingScreen: false, ...rating },
				},
				{ type: "" },
			);
		}
	}

	return rootReducer(state, action);
};
