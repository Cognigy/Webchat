import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
}

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({ liveContent }) => {
	const [liveMessages, setLiveMessages] = useState<{ id: string; text: string }[]>([]);
	const messages = useSelector(state => state.messages.messageHistory);
	const announcedIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!messages.length) return;

		// Identify unannounced messages
		const unannouncedMessages = messages.filter(msg => {
			const id = `webchatMessageId-${msg.timestamp}`;
			return !announcedIdsRef.current.has(id);
		});

		if (!unannouncedMessages.length) return;

		// Process unannounced messages
		const timeout = setTimeout(() => {
			const newLiveMessages = unannouncedMessages.map(msg => {
				const id = `webchatMessageId-${msg.timestamp}`;
				announcedIdsRef.current.add(id);

				// Use live content if available, otherwise extract from DOM
				const text = liveContent[id] || getTextFromDOM(id);

				return { id, text: cleanUpText(text) || "A new message" };
			});

			setLiveMessages(prev => [...prev.slice(-3), ...newLiveMessages]);
		}, 100);

		return () => clearTimeout(timeout);
	}, [messages, liveContent]);

	return (
		<div
			aria-live="polite"
			aria-relevant="additions text"
			aria-atomic="false"
			id="webchatMessageContainerScreenReaderLiveRegion"
			className="sr-only"
		>
			{liveMessages.map(message => (
				<div key={message.id}>{message.text}</div>
			))}
		</div>
	);
};

export default ScreenReaderLiveRegion;
