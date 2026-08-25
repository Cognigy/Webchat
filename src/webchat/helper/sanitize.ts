import DOMPurify, { Config } from "dompurify";
import { storeRef } from "../store/store";

// Tags that are always blocked regardless of caller configuration (WCH-SI10-001).
// These were previously present in the allow-list but are explicitly excluded by
// DOMPurify's own secure defaults because they enable XSS, URL hijacking, CSS
// exfiltration, phishing, or arbitrary plugin execution:
//   applet  — Java applet execution
//   base    — rewrites all relative URLs on the host page
//   embed   — loads arbitrary external content / plugins
//   form    — posts user data to attacker-controlled URLs
//   frame / frameset / noframes — clickjacking and legacy frame injection
//   iframe  — inline HTML documents; srcdoc = direct XSS vector
//   link    — loads external stylesheets
//   meta    — HTTP redirects and CSP bypass via http-equiv
//   object  — loads Flash, PDFs, and arbitrary external content
//   style   — CSS injection and attribute-value exfiltration
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
	"head",
	"header",
	"hr",
	"html",
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
};

export const sanitizeHTML = (text: string) => {
	const customAllowedHtmlTags =
		storeRef?.getState().config.settings.widgetSettings.customAllowedHtmlTags;

	const configToUse = customAllowedHtmlTags
		? { ...config, ALLOWED_TAGS: customAllowedHtmlTags }
		: config;

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
