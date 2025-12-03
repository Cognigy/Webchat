import { IWebchatMessage, IWebchatTemplateAttachment } from "@cognigy/socket-client";
import { IStreamingMessage } from "../../../common/interfaces/message";

export function generateRandomId(): string {
	return String(Math.random()).slice(2, 18);
}

export function isAnimatedRichBotMessage(message: IStreamingMessage): boolean {
	const { _facebook, _webchat } = message?.data?._cognigy || {};
	const payload = (_webchat as IWebchatMessage) || _facebook || {};

	const isQuickReplies = !!(
		payload?.message?.quick_replies && payload.message.quick_replies.length > 0
	);

	const isTextWithButtons =
		(payload?.message?.attachment as IWebchatTemplateAttachment)?.payload?.template_type ===
		"button";

	const hasMessengerText = !!payload?.message?.text;

	const isAnimatedMsg = isQuickReplies || isTextWithButtons || hasMessengerText;

	return isAnimatedMsg;
}

// Matches strings containing only whitespace and escape sequence characters [space, tab (\t), newline (\n), carriage return (\r), form feed (\f), vertical tab (\v), backspace (\b)]
const ESCAPE_SEQUENCE_REGEX = /^[\s\b]+$/u;

/**
 * Checks if a string consists only of whitespace or escape sequences.
 * @param text The string to check.
 * @returns True if the string contains only whitespace or escape sequences; otherwise, false.
 */
export function isTextOnlyEscapeSequence(text: unknown): boolean {
	return typeof text === "string" && ESCAPE_SEQUENCE_REGEX.test(text);
}
