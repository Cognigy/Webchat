import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
}

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({ liveContent }) => {
	const [liveMessages, setLiveMessages] = useState<string[]>([]);
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

				return cleanUpText(text) || "A new message";
			});

			setLiveMessages(prev => [...prev, ...newLiveMessages]);
		}, 100);

		return () => clearTimeout(timeout);
	}, [messages, liveContent]);

	return (
		<div
			aria-live="polite"
			aria-relevant="additions text"
			id="webchatMessageContainerScreenReaderLiveRegion"
			className="sr-only"
		>
			{liveMessages.map((msg, index) => (
				<div key={index}>{msg}</div>
			))}
		</div>
	);
};

export default ScreenReaderLiveRegion;
