import DOMPurify, { Config } from "dompurify";
import { storeRef } from "../store/store";

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

// Hard deny-list: these tags are never permitted regardless of tenant configuration.
// Allowing any of these opens XSS, clickjacking, HTML-injection, or data-exfiltration
// vectors even when ALLOWED_ATTR is otherwise constrained.
// Applied via both FORBID_TAGS (DOMPurify-level, unconditional) and a pre-filter on
// customAllowedHtmlTags (defence-in-depth before DOMPurify is even invoked).
export const ALWAYS_BLOCKED_TAGS = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"applet",
	"frame",
	"frameset",
	"meta",
	"base",
	"link",
	"style",
	"form",
]);

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
	if (customAllowedHtmlTags) {
		// Pre-filter the tenant-supplied list before passing to DOMPurify (defence-in-depth).
		// FORBID_TAGS in the base config already blocks these at the DOMPurify level,
		// but filtering here makes the guarantee explicit and avoids passing dangerous
		// tag names into DOMPurify's ALLOWED_TAGS at all.
		const safeTags = customAllowedHtmlTags.filter(
			tag => !ALWAYS_BLOCKED_TAGS.has(tag.toLowerCase()),
		);
		configToUse = { ...config, ALLOWED_TAGS: safeTags };
	}

	return DOMPurify.sanitize(text, configToUse).toString();
};

export const stripHtmlToInertText = (text: string): string => {
	// 1. strip tags: parse as HTML and keep only the text content
	const stripped = new DOMParser().parseFromString(text, "text/html").body.textContent || "";
	// 2. re-escape so <, >, & render as literal characters and can never
	//    be reinterpreted as markup downstream (robust to nested encoding)
	const escaper = document.createElement("div");
	escaper.textContent = stripped;
	return escaper.innerHTML;
};
