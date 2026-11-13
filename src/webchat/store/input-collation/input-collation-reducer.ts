import { Reducer } from "redux";
import { IMessage } from "../../../common/interfaces/message";
import { SendMessageAction } from "../messages/message-middleware";

export interface InputCollationState {
	messages: IMessage[];
}

const getInitialState = (): InputCollationState => ({
	messages: [],
});

const ADD_COLLATED_MESSAGE = "ADD_COLLATED_MESSAGE";
export const addCollatedMessage = (message: IMessage) => ({
	type: ADD_COLLATED_MESSAGE as "ADD_COLLATED_MESSAGE",
	message,
});
export type AddCollatedMessageAction = ReturnType<typeof addCollatedMessage>;

const SUBMIT_COLLATED_MESSAGES = "SUBMIT_COLLATED_MESSAGES";
export const submitCollatedMessages = () => ({
	type: SUBMIT_COLLATED_MESSAGES as "SUBMIT_COLLATED_MESSAGES",
});
export type SubmitCollatedMessagesAction = ReturnType<typeof submitCollatedMessages>;

type InputCollationAction =
	| AddCollatedMessageAction
	| SubmitCollatedMessagesAction
	| SendMessageAction;

export const inputCollation: Reducer<InputCollationState, InputCollationAction> = (
	state = getInitialState(),
	action,
) => {
	switch (action.type) {
		case "ADD_COLLATED_MESSAGE": {
			return {
				...state,
				messages: [...state.messages, action.message],
			};
		}

		case "SEND_MESSAGE": {
			// Showing a collated message must keep the batch it was just added to.
			if (action.only === "display") return state;

			return {
				...state,
				messages: [],
			};
		}

		case "SUBMIT_COLLATED_MESSAGES": {
			return {
				...state,
				messages: [],
			};
		}
	}

	return state;
};
