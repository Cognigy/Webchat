import DOMPurify, { Config } from "dompurify";
import { storeRef } from "../store/store";
import { ALWAYS_BLOCKED_TAGS } from "../../common/constants/blocked-tags";

// Re-export so existing consumers of sanitize.ts do not need a path change.
export { ALWAYS_BLOCKED_TAGS };

// Tags removed from the previous allow-list to align with DOMPurify's secure defaults
// (WCH-SI10-001). Each tag enables a distinct attack vector:
//   applet          — Java applet execution
//   base            — rewrites all relative URLs on the host page
//   body / html / head — structural document elements; no legitimate use in sanitised fragments
//   embed           — loads arbitrary external content / plugins
//   form            — posts user data to attacker-controlled URLs
//   frame / frameset / noframes — clickjacking and legacy frame injection
//   iframe          — inline HTML documents; srcdoc = direct XSS vector
//   link            — loads external stylesheets
//   meta            — HTTP redirects and CSP bypass via http-equiv
//   object          — loads Flash, PDFs, and arbitrary external content
//   style           — CSS injection and attribute-value exfiltration
// These tags are blocked by default when no custom tag list is configured.
// Tenants can supply a replacement list via widgetSettings.customAllowedHtmlTags,
// but dangerous tags are always stripped from that list before it is applied (PR #309).
export const allowedHtmlTags = [
	"a",
	"abbr",
	"acronym",
	"address",
	"area",
	"article",
	"aside",
	"audio",
	"b",
	"basefont",
	"bdi",
	"bdo",
	"big",
	"blockquote",
	"br",
	"button",
	"canvas",
	"caption",
	"center",
	"cite",
	"code",
	"col",
	"colgroup",
	"data",
	"datalist",
	"dd",
	"del",
	"details",
	"dfn",
	"dialog",
	"dir",
	"div",
	"dl",
	"dt",
	"em",
	"fieldset",
	"figcaption",
	"figure",
	"font",
	"footer",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"header",
	"hr",
	"i",
	"img",
	"input",
	"ins",
	"kbd",
	"label",
	"legend",
	"li",
	"main",
	"map",
	"mark",
	"meter",
	"nav",
	"ol",
	"optgroup",
	"option",
	"output",
	"p",
	"param",
	"picture",
	"pre",
	"progress",
	"q",
	"rp",
	"rt",
	"ruby",
	"s",
	"samp",
	"section",
	"select",
	"small",
	"source",
	"span",
	"strike",
	"strong",
	"sub",
	"summary",
	"sup",
	"svg",
	"table",
	"tbody",
	"td",
	"template",
	"textarea",
	"tfoot",
	"th",
	"thead",
	"time",
	"title",
	"tr",
	"track",
	"tt",
	"u",
	"ul",
	"var",
	"video",
	"wbr",
];

// Attributes that are always blocked regardless of caller configuration (WCH-SI10-001).
// Removed from the previous allow-list:
//   action / formaction — form submission to attacker-controlled URLs
//   sandbox             — giving content control over its own sandbox policy
//   srcdoc              — inline HTML document in an iframe (direct XSS vector)
//   style               — inline CSS injection and attribute-value exfiltration
//   target              — controls navigation target (_blank without rel is risky)
export const allowedHtmlAttributes = [
	"accept",
	"accept-charset",
	"accesskey",
	"align",
	"alt",
	"autocomplete",
	"autofocus",
	"autoplay",
	"bgcolor",
	"border",
	"charset",
	"checked",
	"cite",
	"class",
	"color",
	"cols",
	"colspan",
	"content",
	"contenteditable",
	"controls",
	"coords",
	"data",
	"data-*",
	"datetime",
	"default",
	"dir",
	"dirname",
	"disabled",
	"download",
	"draggable",
	"dropzone",
	"enctype",
	"for",
	"form",
	"headers",
	"height",
	"hidden",
	"high",
	"href",
	"hreflang",
	"http-equiv",
	"id",
	"ismap",
	"kind",
	"label",
	"lang",
	"list",
	"loop",
	"low",
	"max",
	"maxlength",
	"media",
	"method",
	"min",
	"multiple",
	"muted",
	"name",
	"novalidate",
	"open",
	"optimum",
	"pattern",
	"placeholder",
	"poster",
	"preload",
	"readonly",
	"rel",
	"required",
	"reversed",
	"rows",
	"rowspan",
	"scope",
	"selected",
	"shape",
	"size",
	"sizes",
	"span",
	"spellcheck",
	"src",
	"srclang",
	"srcset",
	"start",
	"step",
	"tabindex",
	"title",
	"translate",
	"type",
	"usemap",
	"value",
	"width",
	"wrap",
];

const config: Config = {
	ALLOWED_TAGS: allowedHtmlTags,
	ALLOWED_ATTR: allowedHtmlAttributes,
	// FORBID_TAGS overrides ALLOWED_TAGS inside DOMPurify — tags listed here are
	// stripped unconditionally, whether the default allow-list or a custom one is used.
	FORBID_TAGS: [...ALWAYS_BLOCKED_TAGS],
};

export const sanitizeHTML = (text: string) => {
	const customAllowedHtmlTags =
		storeRef?.getState().config.settings.widgetSettings.customAllowedHtmlTags;

	let configToUse = config;
	if (Array.isArray(customAllowedHtmlTags)) {
		// Pre-filter the tenant-supplied list before passing to DOMPurify (defence-in-depth).
		// config-reducer already strips blocked tags and non-strings at config-load time, but
		// we guard here too in case sanitizeHTML is ever called outside the normal config path.
		// Non-array values (e.g. a plain string) fall through to the default config — same
		// permissive fallback as config-reducer's sanitizeCustomAllowedHtmlTags().
		const safeTags = customAllowedHtmlTags.filter(
			(tag): tag is string =>
				typeof tag === "string" && !ALWAYS_BLOCKED_TAGS.has(tag.toLowerCase().trim()),
		);
		configToUse = { ...config, ALLOWED_TAGS: safeTags };
	}

	return DOMPurify.sanitize(text, configToUse).toString();
};

const textContentOf = (html: string): string =>
	// DOMParser is inert: no scripts run and no resources load.
	new DOMParser().parseFromString(html, "text/html").body.textContent || "";

const MAX_STRIP_PASSES = 10;

// A Private Use Area character that does not occur in the text. The HTML parser
// treats it as plain text everywhere, so it can stand in for "&". Returns
// undefined only if the text contains all 6400 of them.
const unusedPrivateUseCharacter = (text: string): string | undefined => {
	for (let code = 0xe000; code <= 0xf8ff; code++) {
		const character = String.fromCharCode(code);
		if (!text.includes(character)) return character;
	}
	return undefined;
};

/**
 * Removes HTML tags from user input and keeps everything else exactly as typed
 * (used for disableHtmlInput). This is the text the endpoint, flows and intents
 * receive (CGY-36060, CGY-40199):
 *
 * - No escaping: a typed "&" stays "&" (Webchat 3.48–3.53 sent "&amp;").
 * - No entity decoding: every "&" is swapped for a placeholder before parsing
 *   and restored after, so "?a=1&region=eu" does not become "?a=1®ion=eu",
 *   and a typed "&#60;img…&#62;" stays that inert text instead of turning into
 *   a real "<img…>" tag. A placeholder, not "&amp;", because the parser does
 *   not decode entities inside raw-text elements such as <script> and <style>:
 *   "<script>a & b</script>" would otherwise come out as "a &amp; b".
 * - Repeated until stable: one pass turns "<<b>img …>" into "<img …>".
 *
 * The result contains no markup, but can contain "<" or ">" characters
 * ("a < b"). chat-components escapes user text at render time when
 * disableHtmlInput is set.
 */
export const stripHtmlTags = (text: string): string => {
	let result = text;
	for (let pass = 0; pass < MAX_STRIP_PASSES; pass++) {
		const placeholder = unusedPrivateUseCharacter(result);
		const stripped = placeholder
			? textContentOf(result.split("&").join(placeholder)).split(placeholder).join("&")
			: textContentOf(result.replace(/&/g, "&amp;"));
		if (stripped === result) return result;
		result = stripped;
	}
	// Pathological nesting: give up on keeping "<" rather than risk markup.
	return result.replace(/</g, "");
};

/**
 * Plain text of a bot-authored HTML string, such as a quick reply title shown
 * in the user bubble after a click. Unlike user input, this is HTML, so its
 * entities are decoded ("Caf&eacute;" → "Café").
 */
export const htmlToPlainText = (html: string): string => textContentOf(html);
