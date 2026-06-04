import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";
import getMessagesListWithoutControlCommands from "../../utils/filter-out-control-commands";
import { IStreamingMessage } from "../../../common/interfaces/message";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
}

interface LiveMessage {
	id: string;
	text: string;
}

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({ liveContent }) => {
	const [liveMessage, setLiveMessage] = useState<LiveMessage | null>(null);
	const messageHistory = useSelector(state => state.messages.messageHistory);
	const messages = getMessagesListWithoutControlCommands(messageHistory, ["acceptPrivacyPolicy"]);
	const announcedIdsRef = useRef<Set<string>>(new Set());
	const isProgressiveRenderingEnabled = useSelector(
		state => state.config.settings.behavior?.progressiveMessageRendering,
	);

	useEffect(() => {
		if (!messages.length) return;

		const unannouncedMessages = messages.filter(msg => {
			const id = `webchatMessageId-${msg.timestamp}`;
			return !announcedIdsRef.current.has(id);
		});

		if (!unannouncedMessages.length) return;

		const isStreamingMessage = (message: unknown): message is IStreamingMessage => {
			return message !== null && typeof message === "object" && "animationState" in message;
		};

		const timeout = setTimeout(() => {
			// Scan for the first unannounced message that is currently announceable.
			// We must NOT stop at index 0 for non-rendered (data-only) messages,
			// otherwise a permanently data-only message would block all later ones.
			for (const candidate of unannouncedMessages) {
				const id = `webchatMessageId-${candidate.timestamp}`;

				// A streaming message that hasn't finished blocks later announcements
				// (preserves in-order announcement of streamed output).
				const isStreaming =
					isProgressiveRenderingEnabled &&
					isStreamingMessage(candidate) &&
					(candidate.animationState === "start" ||
						candidate.animationState === "animating");
				if (isStreaming) return;

				// Event status pills announce themselves via aria-live="assertive".
				// Mark handled and continue; they must not block later real messages.
				if (liveContent[id] === `IGNORE-${id}`) {
					announcedIdsRef.current.add(id);
					continue;
				}

				// Prefer chat-components' live content; otherwise read the DOM.
				// getTextFromDOM returns null when no <article data-message-id>
				// node exists, which is the signal for a not-rendered message.
				const liveText = liveContent[id];
				const domText = liveText ? null : getTextFromDOM(id);

				// "Rendered" iff chat-components produced live content for it,
				// or an <article data-message-id> node exists in the DOM.
				const isRendered = Boolean(liveText) || domText !== null;

				// Data-only / unsupported message: not in the chat log UI.
				// Skip WITHOUT marking announced so it can still be announced
				// if it becomes rendered later (e.g. progressive rendering).
				if (!isRendered) {
					continue;
				}

				// Rendered: announce exactly one message per effect run.
				// Fall back to "A new message" for rendered-but-textless nodes.
				announcedIdsRef.current.add(id);
				const text = cleanUpText(liveText || domText || "A new message");
				setLiveMessage({ id, text });
				return;
			}
		}, 100);

		return () => clearTimeout(timeout);
	}, [messages, liveContent, isProgressiveRenderingEnabled]);

	return (
		<div
			aria-live="polite"
			aria-relevant="additions text"
			aria-atomic="true"
			id="webchatMessageContainerScreenReaderLiveRegion"
			className="sr-only"
		>
			{liveMessage && <div key={liveMessage.id}>{liveMessage.text}</div>}
		</div>
	);
};

export default ScreenReaderLiveRegion;
