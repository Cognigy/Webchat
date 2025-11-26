import moment from "moment";
import { IMessage } from "../../../../common/interfaces/message";
import getTextFromMessage, { getMessageAttachmentType } from "../../../../webchat/helper/message";
import { findReverse } from "../../../utils/find-reverse";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { PrevConversationsState } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";

/**
 * Returns a human-readable relative time label for the last message in a conversation.
 * Uses calendar-based logic for "Today" and "Yesterday", and custom labels for days, weeks, months, and years.
 */
export const getRelativeTime = (messages: IMessage[]) => {
	const lastMessage = messages[messages.length - 1];
	if (!lastMessage?.timestamp) return "";

	const messageMoment = moment(lastMessage.timestamp);
	const now = moment();

	if (messageMoment.isSame(now, "day")) return "Today";

	if (messageMoment.isSame(now.clone().subtract(1, "day"), "day")) return "Yesterday";

	const messageDate = messageMoment.clone().startOf("day");
	const today = now.clone().startOf("day");

	const daysDiff = today.diff(messageDate, "days");
	if (daysDiff < 7) return `${daysDiff} days ago`;

	const weeksDiff = Math.floor(daysDiff / 7);
	if (weeksDiff <= 4 && daysDiff < 31)
		return weeksDiff === 1 ? "1 week ago" : `${weeksDiff} weeks ago`;

	const monthsDiff = now.diff(messageDate, "months");
	if (monthsDiff <= 12 && daysDiff < 366)
		return monthsDiff === 1 ? "1 month ago" : `${monthsDiff} months ago`;

	const yearsDiff = now.diff(messageMoment, "years");
	return yearsDiff === 1 ? "1 year ago" : `${yearsDiff} years ago`;
};

export const getLastMessagePreview = (messages: IMessage[]) => {
	const lastReadableMessage = findReverse(messages, message => !!getTextFromMessage(message));
	if (lastReadableMessage) {
		return getTextFromMessage(lastReadableMessage);
	}

	// we don't have text messages in the chat
	// we need to find the last attachment type
	const lastMessage = messages[messages.length - 1];

	const attachmentType = getMessageAttachmentType(lastMessage);

	// TODO: implement icons here
	switch (attachmentType) {
		case "template":
			return "template...";
		case "image":
			return "image...";
		case "video":
			return "video...";
		case "audio":
			return "audio...";
		default:
			return "...";
	}
};

export const getParticipants = (messages: IMessage[], config: IWebchatConfig) => {
	const partecipants: string[] = [];
	const hasBot = messages.some(message => ["bot", "engagement"].includes(message?.source));
	const hasLiveAgent = messages.some(message => message?.source === "agent");

	// TODO: get the correct names, if any, from the endpoint
	if (hasBot) partecipants.push(config?.settings?.layout?.title || "Bot");
	if (hasLiveAgent) partecipants.push("Agent");

	if (!hasBot && !hasLiveAgent) return "You";

	return partecipants.join(", ");
};

export const getAvatars = (messages: IMessage[]) => {
	const notUserMessages = messages.filter(message => message?.source !== "user");

	const uniqueAvatars = [...new Set(notUserMessages.map(item => item?.avatarUrl))];
	return uniqueAvatars;
};

export const sortConversationsByFreshness = (conversations: PrevConversationsState) => {
	const sortedConversations: PrevConversationsState = Object.entries(conversations)
		.sort(
			([, a], [, b]) =>
				(b.messages[b.messages.length - 1]?.timestamp || 0) -
				(a.messages[a.messages.length - 1]?.timestamp || 0),
		)
		.reduce(
			(r, [k, v]) => ({
				...r,
				[k]: v,
			}),
			{},
		);
	return sortedConversations;
};

export const isConversationEnded = (messages: IMessage[]) => {
	if (!Array.isArray(messages) || messages.length === 0) {
		return false;
	}
	// TODO: get expiration time from the endpoint (pending from coming v3)
	const EXPIRATION_DAYS_LIMIT = 30;
	const lastMessageTimestamp = messages[messages.length - 1]?.timestamp || Date.now();
	const daysDifference = moment().diff(lastMessageTimestamp, "days");
	if (daysDifference >= EXPIRATION_DAYS_LIMIT) return true;
	return false;
};
