import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
}

interface LiveMessage {
	id: string;
	text: string;
}

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({ liveContent }) => {
	const [liveMessage, setLiveMessage] = useState<LiveMessage | null>(null);
	const messages = useSelector(state => state.messages.messageHistory);
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
			announcedIdsRef.current.add(id);

			// Use live content if available, otherwise extract from DOM
			const rawText = liveContent[id] || getTextFromDOM(id);
			const text = cleanUpText(rawText) || "A new message";

			setLiveMessage({ id, text });

			setTimeout(() => setLiveMessage(null), 500);
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
