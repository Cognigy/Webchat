import { IMessage } from '../../../common/interfaces/message';
import { IMessageEvent } from "../../../common/interfaces/event";

export type MessageState = (IMessage | IMessageEvent)[]

const ADD_MESSAGE = 'ADD_MESSAGE'
export const addMessage = (message: IMessage, unseen?: boolean) => ({
	type: ADD_MESSAGE as 'ADD_MESSAGE',
	message,
	unseen
});
export type AddMessageAction = ReturnType<typeof addMessage>;

const ADD_MESSAGE_EVENT = 'ADD_MESSAGE_EVENT'
export const addMessageEvent = (event: IMessageEvent) => ({
	type: ADD_MESSAGE_EVENT as 'ADD_MESSAGE_EVENT',
	event
});
export type AddMessageEventAction = ReturnType<typeof addMessageEvent>;

interface CognigyData {
	_messageId?: string;
}

// Helper to get message ID from message
const getMessageId = (message: IMessage) => {
	return (message.data?._cognigy as CognigyData)?._messageId;
};

// slice of the store state that contains the info about streaming mode, to avoid circular dependency
type ConfigState = {
	settings?: {
		behavior?: {
			streamingMode?: boolean;
		};
	};
};

export const createMessageReducer = (getState: () => { config: ConfigState }) => {
	return (state: MessageState = [], action: AddMessageAction | AddMessageEventAction) => {
		switch (action.type) {
			case 'ADD_MESSAGE_EVENT': {
				return [...state, action.event];
			}
			case 'ADD_MESSAGE': {
				const newMessage = action.message;

				const isStreamingEnabled = getState().config?.settings?.behavior?.streamingMode;

				// If message has no input ID, add it normally
				if (!isStreamingEnabled || !getMessageId(newMessage)) {
					return [...state, newMessage];
				}

				const newMessageId = getMessageId(newMessage);

				// Find existing message with same ID
				const lastMatchingIndex = state.findIndex(msg => {
					if ('text' in msg) {
						const msgId = getMessageId(msg as IMessage);
						if (msgId) {
							return msgId === newMessageId;
						}
					}
					return false;
				});

				// If no matching message, create new with array
				if (lastMatchingIndex === -1) {
					return [...state, {
						...newMessage,
						text: [newMessage.text as string],
						shouldAnimate: true,
						id: newMessageId,
					}];
				}

				// Get existing message
				const existingMessage = state[lastMatchingIndex] as IMessage;
				const newState = [...state];

				// Convert existing text to array if needed
				const existingText = Array.isArray(existingMessage.text)
					? existingMessage.text
					: [existingMessage.text];

				// Append new chunk
				newState[lastMatchingIndex] = {
					...existingMessage,
					text: [...existingText, newMessage.text as string]
				} as IMessage;

				return newState;
			}
			default:
				return state;
		}
	}
};