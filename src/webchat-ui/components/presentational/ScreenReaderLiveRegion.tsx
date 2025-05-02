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

	// Extract text from the DOM for screen reader by walking the DOM tree and concatenating text content while ignoring hidden elements
	const extractTextForScreenReader = (root: HTMLElement): string => {
		// Helper function to recursively walk through child nodes
		const walk = (node: Node): string => {
			if (node.nodeType === Node.TEXT_NODE) {
				return node.textContent ?? "";
			}

			if (node.nodeType !== Node.ELEMENT_NODE) return "";

			const el = node as HTMLElement;

			// Skip hidden or presentational elements
			const isHidden =
				el.hasAttribute("aria-hidden") ||
				el.getAttribute("role") === "presentation" ||
				el.getAttribute("role") === "none" ||
				el.hasAttribute("hidden") ||
				getComputedStyle(el).display === "none" ||
				getComputedStyle(el).visibility === "hidden";

			if (isHidden) return "";

			// Use aria-label if available
			if (el.hasAttribute("aria-label")) {
				return el.getAttribute("aria-label") + "\n";
			}

			// Handle specific elements
			const tagHandlers: Record<string, () => string> = {
				H1: () => walkChildren(el).trim() + ".\n",
				H2: () => walkChildren(el).trim() + ".\n",
				H3: () => walkChildren(el).trim() + ".\n",
				H4: () => walkChildren(el).trim() + ".\n",
				H5: () => walkChildren(el).trim() + ".\n",
				H6: () => walkChildren(el).trim() + ".\n",
				P: () => walkChildren(el).trim() + "\n",
				LI: () => walkChildren(el).trim() + ", ",
				UL: () => walkChildren(el),
				OL: () => walkChildren(el),
				BR: () => "\n",
			};

			return tagHandlers[el.tagName]?.() ?? walkChildren(el);
		};

		const walkChildren = (el: HTMLElement): string => {
			return Array.from(el.childNodes).map(walk).join("");
		};

		return walk(root);
	};

	// Clean up text by removing emojis, HTML tags, and extra spaces
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
