// Hard deny-list for HTML tags that must never be permitted via customAllowedHtmlTags,
// regardless of tenant configuration. Each tag enables a distinct attack vector:
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
//
// This file has no imports so it can be consumed by both sanitize.ts (which imports
// the Redux store) and config-reducer.ts (which the store imports) without creating
// a circular dependency between them.
export const ALWAYS_BLOCKED_TAGS = new Set([
	"script",
	"iframe",
	"object",
	"embed",
	"applet",
	"frame",
	"frameset",
	"noframes",
	"meta",
	"base",
	"link",
	"style",
	"form",
	"body",
	"html",
	"head",
]);
