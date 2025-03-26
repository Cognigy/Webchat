import { IMessage, IStreamingMessage, IUserMessage } from "../../../common/interfaces/message";
import { IMessageEvent } from "../../../common/interfaces/event";
import { generateRandomId, isAnimatedRichBotMessage } from "./helper";

export interface MessageState {
	messageHistory: (IMessage | IMessageEvent)[];
	visibleOutputMessages: string[];
	currentlyAnimatingId: string | null;
}

const initialState: MessageState = {
	messageHistory: [],
	visibleOutputMessages: [],
	currentlyAnimatingId: null,
};

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

const CLEAR_MESSAGES = "CLEAR_MESSAGES" as const;
export const clearMessages = () => ({
	type: CLEAR_MESSAGES,
});
export type ClearMessagesAction = ReturnType<typeof clearMessages>;

interface CognigyData {
	_messageId?: string;
	_finishReason?: string;
}

// Helper to get message ID from message
const getMessageId = (message: IMessage) => {
	return (message.data?._cognigy as CognigyData)?._messageId;
};

// Helper to get finishReason from message
// If there is no messageId, we are not streaming, so the message is always finished and finishReason is "stop"
const getFinishReason = (message: IMessage, messageId?: string) => {
	return messageId ? (message.data?._cognigy as CognigyData)?._finishReason : "stop";
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
		state: MessageState = initialState,
		action:
			| AddMessageAction
			| AddMessageEventAction
			| SetMessageAnimatedAction
			| ClearMessagesAction,
	) => {
		switch (action.type) {
			case "ADD_MESSAGE_EVENT": {
				return {
					...state,
					messageHistory: [...state.messageHistory, action.event],
				};
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
					return {
						...state,
						messageHistory: [...state.messageHistory, newMessage],
					};
				}

				const visibleOutputMessages = state.visibleOutputMessages;
				let newMessageId = getMessageId(newMessage);
				let nextAnimatingId = state.currentlyAnimatingId;

				// If message doesn't have text, still add an ID.
				// Check if the message is an animated bot message (e.g. Text with Quick Replies) and set the animationState accordingly
				// if there is a messageId, it means the message was a streaming message that was finished and will be handled further below
				if (!newMessage.text && !newMessageId) {
					const isAnimated = isAnimatedRichBotMessage(newMessage as IStreamingMessage);

					const newMessageId = generateRandomId();

					if (!state.currentlyAnimatingId) {
						visibleOutputMessages.push(newMessageId as string);
					}
					if (!nextAnimatingId) {
						nextAnimatingId = isAnimated ? newMessageId : null;
					}

					return {
						...state,
						messageHistory: [
							...state.messageHistory,
							{
								...newMessage,
								id: newMessageId,
								animationState: isAnimated ? "start" : "done",
								finishReason: "stop",
							},
						],
						visibleOutputMessages,
						currentlyAnimatingId: nextAnimatingId,
					};
				}

				// Find existing message with same ID if we're collating outputs
				let messageIndex = -1;
				if (isOutputCollationEnabled && newMessageId) {
					messageIndex = state.messageHistory.findIndex(msg => {
						if ("text" in msg) {
							const msgId = getMessageId(msg as IMessage);
							if (msgId) {
								return msgId === newMessageId;
							}
						}
						return false;
					});
				}

				const finishReason = getFinishReason(newMessage, newMessageId);

				if (!newMessageId) {
					newMessageId = generateRandomId();
				}

				if (!nextAnimatingId) {
					nextAnimatingId = newMessageId;
				}

				// If no matching message and the message has no text, we discard the message
				if (messageIndex === -1 && !newMessage.text) {
					return state;
				}

				// If no matching message, create new with array
				if (messageIndex === -1) {
					if (!state.currentlyAnimatingId) {
						visibleOutputMessages.push(newMessageId as string);
					}

					// break string into chunks on new lines so that markdown is evaluated while a long text is animated
					const textChunks = (newMessage.text as string)
						.split(/(\n)/)
						.filter(chunk => chunk.length > 0);

					return {
						...state,
						messageHistory: [
							...state.messageHistory,
							{
								...newMessage,
								text: textChunks,
								id: newMessageId,
								animationState: "start",
								finishReason,
							},
						],
						visibleOutputMessages,
						currentlyAnimatingId: nextAnimatingId,
					};
				}

				/*
				 ** From here on, we are only handling a streaming message that has already been added to the messageHistory
				 */

				// Get existing message
				const existingMessage = state.messageHistory[messageIndex] as IStreamingMessage;
				const newMessageHistory = [...state.messageHistory];

				// if there is a finishReason, only add the finishReason to the streaming message
				if (finishReason) {
					newMessageHistory[messageIndex] = {
						...existingMessage,
						finishReason,
					};
					return {
						...state,
						messageHistory: newMessageHistory,
					};
				}

				// Convert existing text to array if needed
				const existingText = Array.isArray(existingMessage.text)
					? existingMessage.text
					: [existingMessage.text];

				// reset animation state
				let nextAnimationState: IStreamingMessage["animationState"] = "start";

				// if the message was exited, keep it exited
				if (existingMessage.animationState === "exited") {
					nextAnimationState = "exited";
				}

				// if the streaming message is empty, keep the animation state of the existing message, since the empty message just streams the finishReason
				if (!newMessage.text) {
					nextAnimationState = existingMessage.animationState;
				}

				// Append new chunk
				newMessageHistory[messageIndex] = {
					...existingMessage,
					text: [...existingText, newMessage.text as string],
					animationState: nextAnimationState,
					finishReason,
				} as IMessage;

				return {
					...state,
					messageHistory: newMessageHistory,
				};
			}

			case "SET_MESSAGE_ANIMATED": {
				const messageIndex = state.messageHistory.findIndex(
					message => "id" in message && message.id === action.messageId,
				);
				if (messageIndex === -1) return state;

				// Create a new Set to deduplicate messages while maintaining order
				const visibleMessagesSet = new Set(state.visibleOutputMessages);

				let currentlyAnimatingId = state.currentlyAnimatingId;

				// Find the next message that should be animated
				if (action.animationState === "done" || action.animationState === "exited") {
					let nextAnimatingMessageFound = false;

					for (let i = messageIndex + 1; i < state.messageHistory.length; i++) {
						const message = state.messageHistory[i];
						if (
							(message.source === "bot" || message.source === "engagement") &&
							"id" in message
						) {
							visibleMessagesSet.add(message.id as string);

							// If we find a message that should be animated (state is "start")
							if (message.animationState === "start" && !nextAnimatingMessageFound) {
								currentlyAnimatingId = message.id as string;
								nextAnimatingMessageFound = true;
								break;
							}
						}
					}

					// If we didn't find a next message to animate, clear the animating ID
					if (!nextAnimatingMessageFound) {
						currentlyAnimatingId = null;
					}
				}

				// Convert Set back to array while maintaining order from messageHistory
				const newVisibleOutputMessages = state.messageHistory
					.filter(
						message => "id" in message && visibleMessagesSet.has(message.id as string),
					)
					.map(message => ("id" in message ? message.id : "")) as string[];

				return {
					...state,
					messageHistory: state.messageHistory.map(message => {
						if ("id" in message && message.id === action.messageId) {
							return { ...message, animationState: action.animationState };
						}
						return message;
					}),
					visibleOutputMessages: newVisibleOutputMessages,
					currentlyAnimatingId,
				};
			}
			case CLEAR_MESSAGES: {
				return {
					...state,
					messageHistory: [],
				};
			}
			default:
				return state;
		}
	};
};
