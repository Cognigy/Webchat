import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, extractTextForScreenReader } from "../../utils/live-region-announcement";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
}

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({ liveContent }) => {
	const [debouncedMessageIds, setDebouncedMessageIds] = useState<string[]>([]);
	const messages = useSelector(state => state.messages.messageHistory);

	useEffect(() => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			const messageId = `webchatMessageId-${lastMessage.timestamp}`;
			if (!debouncedMessageIds.includes(messageId)) {
				const timeout = setTimeout(() => {
					setDebouncedMessageIds(prevIds => [...prevIds, messageId]);
				}, 500);
				return () => clearTimeout(timeout);
			}
		}
	}, [messages, debouncedMessageIds]);

	// If live content is available for a message, use it. Otherwise, extract text from the DOM.
	const liveText = useMemo(() => {
		return debouncedMessageIds.map(messageId => {
			if (liveContent[messageId]) {
				const cleanText = cleanUpText(liveContent[messageId]);
				return <div key={messageId}>{cleanText}</div>;
			}

			const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
			if (messageElement) {
				const cleanText = extractTextForScreenReader(messageElement as HTMLElement);
				return <div key={messageId}>{cleanText || "A new message"}</div>;
			}

			// Fallback text when message arrives
			return <div key={messageId}>A new message</div>;
		});
	}, [debouncedMessageIds, liveContent]);

	return (
		<div
			aria-live="polite"
			aria-relevant="additions text"
			id="webchatMessageContainerScreenReaderLiveRegion"
			className="sr-only"
		>
			{liveText}
		</div>
	);
};

export default ScreenReaderLiveRegion;
