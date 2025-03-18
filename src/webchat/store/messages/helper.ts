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
