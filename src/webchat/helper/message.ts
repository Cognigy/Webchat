import { TWebchat3Event } from "@cognigy/socket-client";
import { IMessageEvent } from "../../common/interfaces/event";
import { IMessage } from "../../common/interfaces/message";

const getTextFromMessage = (message: IMessage) => {
	// Check if message is plain text
	let text: string | string[] = "";
	if (message?.text) {
		text = message.text;
		// Check if message is quick reply message
	} else if (message?.data?._cognigy?._webchat?.message?.text) {
		text = message.data._cognigy._webchat.message.text;
		// Check if message is button message
	} else if (
		message?.data?._cognigy?._webchat?.message?.attachment?.type === "template" &&
		message?.data?._cognigy?._webchat?.message?.attachment?.payload?.template_type === "button"
	) {
		text = message.data._cognigy._webchat.message.attachment.payload.text;
	}
	// Before return the text strip HTML tags
	if (Array.isArray(text)) {
		text = text.map(t => t.replace(/(<([^>]+)>)/gi, ""));
	}
	if (typeof text === "string") {
		text = text.replace(/(<([^>]+)>)/gi, "");
	}
	return text;
};

export const getMessageAttachmentType = (message: IMessage): string => {
	const isTextMessage = getTextFromMessage(message);
	if (isTextMessage) return "";

	return message?.data?._cognigy?._webchat?.message?.attachment?.type || "";
};

export const isQueueUpdate = (message: IMessageEvent): boolean => {
	return !!(message?.data?._cognigy?._webchat3?.type === "queueUpdate");
};

export const isEventMessage = (message: IMessageEvent): boolean => {
	return !!message?.data?._cognigy?._webchat3?.type;
};

export const getEventPayload = (message: IMessageEvent): TWebchat3Event["payload"] => {
	return message?.data?._cognigy?._webchat3?.payload;
};

export const getEventType = (message: IMessageEvent): string => {
	return message?.data?._cognigy?._webchat3?.type;
};

export default getTextFromMessage;
