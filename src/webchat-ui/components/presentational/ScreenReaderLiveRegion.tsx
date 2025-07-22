import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";
import getMessagesListWithoutControlCommands from "../../utils/filter-out-control-commands";

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

	useEffect(() => {
		if (!messages.length) return;

		const unannouncedMessages = messages.filter(msg => {
			const id = `webchatMessageId-${msg.timestamp}`;
			return !announcedIdsRef.current.has(id);
		});

		if (!unannouncedMessages.length) return;

		const timeout = setTimeout(() => {
			const firstUnannouncedMsg = unannouncedMessages[0]; // Only announce one at a time
			const id = `webchatMessageId-${firstUnannouncedMsg.timestamp}`;

			// Check if this is a streaming message that hasn't finished
			const isStreamingMessage =
				"animationState" in firstUnannouncedMsg &&
				(firstUnannouncedMsg.animationState === "start" ||
					firstUnannouncedMsg.animationState === "animating");

			// If streaming, don't announce yet
			if (isStreamingMessage) return;

			announcedIdsRef.current.add(id);

			// Skip announcement if the message is marked as "IGNORE". Done by ChatEvent message component, as it has aria-live="assertive"
			if (liveContent[id] === `IGNORE-${id}`) {
				setLiveMessage(null);
				return;
			}

			// Use live content if available, otherwise extract from DOM
			const rawText = liveContent[id] || getTextFromDOM(id);
			const text = cleanUpText(rawText || "A new message");

			setLiveMessage({ id, text });
		}, 100);

		return () => clearTimeout(timeout);
	}, [messages, liveContent]);

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
