import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";

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

	// Extract text from the message element by prioritizing aria-label and excluding hidden elements
	const extractTextForScreenReader = (root: HTMLElement): string => {
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
			{
				acceptNode: node => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const el = node as HTMLElement;
						const isHidden =
							el.hasAttribute("aria-hidden") ||
							el.getAttribute("role") === "presentation" ||
							el.getAttribute("role") === "none" ||
							el.hasAttribute("hidden") ||
							getComputedStyle(el).display === "none" ||
							getComputedStyle(el).visibility === "hidden";
						return isHidden ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
					}
					return NodeFilter.FILTER_ACCEPT;
				},
			},
		);

		let node: Node | null;
		let textContent = "";

		while ((node = walker.nextNode())) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				const el = node as HTMLElement;
				if (el.hasAttribute("aria-label")) {
					textContent += el.getAttribute("aria-label") + " ";
				}
			} else if (node.nodeType === Node.TEXT_NODE) {
				textContent += (node as Text).textContent + " ";
			}
		}

		return textContent;
	};

	// Clean up the text by removing emojis, HTML tags, and extra spaces
	const cleanUpText = (text: string) => {
		const textWithoutEmoji = text
			.replace(
				/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F|\u200D)+/gu,
				"",
			)
			.replace(/<\/?[^>]+(>|$)/g, "")
			.replace(/&nbsp;/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		return textWithoutEmoji;
	};

	// If live content is available for a message, use it. Otherwise, extract text from the DOM.
	const liveText = useMemo(() => {
		return debouncedMessageIds.map(messageId => {
			if (liveContent[messageId]) {
				const cleanText = cleanUpText(liveContent[messageId]);
				return <div key={messageId}>{cleanText}</div>;
			}

			const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
			if (messageElement) {
				const extractedText = extractTextForScreenReader(messageElement as HTMLElement);
				const cleanText = cleanUpText(extractedText);
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
