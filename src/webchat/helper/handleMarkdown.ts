// Matches characters typically used in Markdown formatting
const markdownCharsRegex = /[*_~#`<>[\]()|]/g;

const markdownElements = {
	header: /^#{1,6}\s.+$/m,
	bold: /\*\*(.+?)\*\*|__(.+?)__/,
	italic: /\*(.+?)\*|_(.+?)_/,
	lists: /^[-*+]\s+.+$/m,
	links: /\[(.+?)\]\((.+?)\)/,
	code: /`(.+?)`/,
	tables: /\|(.+?)\|/,
	blockquote: /^>\s.+$/m,
};

export function removeMarkdownChars(textChunk: string): string {
	return textChunk.replace(markdownCharsRegex, "");
}

export function isValidMarkdown(text: string): boolean {
	return Object.values(markdownElements).some(pattern => pattern.test(text));
}
