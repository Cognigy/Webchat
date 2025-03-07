import { IMessage, IStreamingMessage } from "../../../common/interfaces/message";
import { IMessageEvent } from "../../../common/interfaces/event";
import { generateRandomId } from "./helper";

export type MessageState = (IMessage | IMessageEvent)[];

const ADD_MESSAGE = "ADD_MESSAGE";
export const addMessage = (message: IMessage, unseen?: boolean) => ({
	type: ADD_MESSAGE as "ADD_MESSAGE",
	message,
	unseen,
});
export type AddMessageAction = ReturnType<typeof addMessage>;

const ADD_MESSAGE_EVENT = "ADD_MESSAGE_EVENT";
export const addMessageEvent = (event: IMessageEvent) => ({
	type: ADD_MESSAGE_EVENT as "ADD_MESSAGE_EVENT",
	event,
});
export type AddMessageEventAction = ReturnType<typeof addMessageEvent>;

const SET_MESSAGE_ANIMATED = "SET_MESSAGE_ANIMATED";
export const setMessageAnimated = (
	messageId: string,
	animationState: IStreamingMessage["animationState"],
) => ({
	type: SET_MESSAGE_ANIMATED as "SET_MESSAGE_ANIMATED",
	messageId,
	animationState,
});
export type SetMessageAnimatedAction = ReturnType<typeof setMessageAnimated>;

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
			collateStreamedOutputs?: boolean;
			progressiveMessageRendering?: boolean;
		};
	};
};

export const createMessageReducer = (getState: () => { config: ConfigState }) => {
	return (
		state: MessageState = [],
		action: AddMessageAction | AddMessageEventAction | SetMessageAnimatedAction,
	) => {
		switch (action.type) {
			case "ADD_MESSAGE_EVENT": {
				return [...state, action.event];
			}
			case "ADD_MESSAGE": {
				const newMessage = action.message;

				const isOutputCollationEnabled =
					getState().config?.settings?.behavior?.collateStreamedOutputs;
				const isprogressiveMessageRenderingEnabled =
					getState().config?.settings?.behavior?.progressiveMessageRendering;

				if (
					(!isOutputCollationEnabled && !isprogressiveMessageRenderingEnabled) ||
					(newMessage.source !== "bot" && newMessage.source !== "engagement")
				) {
					return [...state, newMessage];
				}

				// If message doesn't have text (e.g. Text with Quick Replies), still add an ID and animationState for enabling the animation.
				if (!newMessage.text) {
					return [
						...state,
						{
							...newMessage,
							id: generateRandomId(),
							animationState: "start",
						},
					];
				}

				let newMessageId = getMessageId(newMessage);

				if (!newMessageId) {
					newMessageId = generateRandomId();
				}

				// Find existing message with same ID if we're collating outputs
				let messageIndex = -1;
				if (isOutputCollationEnabled) {
					messageIndex = state.findIndex(msg => {
						if ("text" in msg) {
							const msgId = getMessageId(msg as IMessage);
							if (msgId) {
								return msgId === newMessageId;
							}
						}
						return false;
					});
				}

				// If no matching message, create new with array
				if (messageIndex === -1) {
					// break string into chunks on new lines so that markdown is evaluated while a long text is animated
					const textChunks = (newMessage.text as string)
						.split(/(\n)/)
						.filter(chunk => chunk.length > 0);

					return [
						...state,
						{
							...newMessage,
							text: textChunks,
							id: newMessageId,
							animationState: "start",
						},
					];
				}

				// Get existing message
				const existingMessage = state[messageIndex] as IStreamingMessage;
				const newState = [...state];

				// Convert existing text to array if needed
				const existingText = Array.isArray(existingMessage.text)
					? existingMessage.text
					: [existingMessage.text];

				let nextAnimationState: IStreamingMessage["animationState"] = "start";
				if (existingMessage.animationState === "exited") {
					nextAnimationState = "exited";
				}

				// Append new chunk
				newState[messageIndex] = {
					...existingMessage,
					text: [...existingText, newMessage.text as string],
					animationState: nextAnimationState,
				} as IMessage;

				return newState;
			}
			case "SET_MESSAGE_ANIMATED": {
				return state.map(message => {
					if ("id" in message && message.id === action.messageId) {
						return { ...message, animationState: action.animationState };
					}
					return message;
				});
			}
			default:
				return state;
		}
	};
};
