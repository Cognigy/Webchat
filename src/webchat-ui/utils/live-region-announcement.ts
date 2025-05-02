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
 * - Prioritizing `aria-label` attributes when available
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

	const extractedText = walk(root);
	const cleanedText = cleanUpText(extractedText);

	return cleanedText;
};
