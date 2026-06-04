/**
 * Cleans up a given text string by:
 * - Removing emojis
 * - Stripping HTML tags
 * - Replacing non-breaking spaces with regular spaces
 * - Collapsing multiple spaces into a single space
 * - Trimming leading and trailing spaces
 *
 * @param text - The input text to clean up
 * @returns The cleaned-up text
 */
export const cleanUpText = (text: string): string => {
	return text
		.replace(
			/([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\uFE0F|\u200D)+/gu,
			"",
		)
		.replace(/<\/?[^>]+(>|$)/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
};

/**
 * Extracts text content from a DOM element for screen readers by:
 * - Walking the DOM tree recursively
 * - Ignoring hidden or presentational elements
 * - Handling specific tags like headings, paragraphs, lists, and line breaks
 *
 * @param root - The root DOM element to extract text from
 * @returns The extracted text content
 */
export const extractTextForScreenReader = (root: HTMLElement): string => {
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
			el.hasAttribute("data-skip-live-region") ||
			getComputedStyle(el).display === "none" ||
			getComputedStyle(el).visibility === "hidden";

		if (isHidden) return "";

		// Handle specific elements
		const tagHandlers: Record<string, (el: HTMLElement) => string> = {
			P: el => walkChildren(el).trim() + "\n",
			LI: el => walkChildren(el).trim() + ". ",
			UL: walkChildren,
			OL: walkChildren,
		};

		["H1", "H2", "H3", "H4", "H5", "H6"].forEach(tag => {
			tagHandlers[tag] = el => walkChildren(el).trim() + ".\n";
		});

		return tagHandlers[el.tagName]?.(el) ?? walkChildren(el);
	};

	const walkChildren = (el: HTMLElement): string => {
		return Array.from(el.childNodes).map(walk).join("");
	};

	const extractedText = walk(root);
	const cleanedText = cleanUpText(extractedText);

	return cleanedText;
};

/**
 * Extracts text from the DOM for a given message ID by:
 * - Querying the DOM for the element with the specified ID
 * - Using the extractTextForScreenReader function to get the text content
 *
 * The <article data-message-id="..."> node only exists when chat-components'
 * Message matcher matched at least one plugin. Data-only / unsupported
 * messages produce no DOM node, so callers can use a `null` return to tell a
 * not-rendered message apart from a rendered-but-textless one.
 *
 * @param id - The message ID to extract text for
 * @returns The extracted text, or `null` if no element exists for the id
 */
export const getTextFromDOM = (id: string): string | null => {
	const messageElement = document.querySelector(`[data-message-id="${id}"]`);
	return messageElement ? extractTextForScreenReader(messageElement as HTMLElement) : null;
};
