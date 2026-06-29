/**
 * When the webchat holds the mobile scroll lock (react-remove-scroll), every
 * scroll/touch gesture outside the webchat subtree is cancelled — including
 * scrolling inside host-page overlays such as cookie-consent banners. Passing
 * such overlays as react-remove-scroll `shards` keeps their internal scroll
 * working while the rest of the page stays locked.
 *
 * These are the container selectors of common consent-management platforms,
 * which render in the host document with their own internal scroll. They are
 * always allowed; embedders can whitelist additional selectors via
 * `widgetSettings.scrollLockAllowSelectors`.
 */
export const DEFAULT_SCROLL_LOCK_ALLOW_SELECTORS: readonly string[] = [
	"#onetrust-consent-sdk", // OneTrust (wraps both the banner and the preference center)
	"#CybotCookiebotDialog", // Cookiebot
	"#usercentrics-root", // Usercentrics
	"#didomi-host", // Didomi
];

/**
 * Resolves the given selectors against the live document into a de-duplicated,
 * document-ordered list of elements. Invalid selectors (e.g. from embedder
 * config) are skipped rather than throwing.
 */
export const resolveScrollLockShards = (selectors: readonly string[]): HTMLElement[] => {
	if (typeof document === "undefined" || selectors.length === 0) return [];

	const nodes: HTMLElement[] = [];
	const seen = new Set<Element>();

	for (const selector of selectors) {
		let matches: NodeListOf<Element>;
		try {
			matches = document.querySelectorAll(selector);
		} catch {
			// ignore malformed selectors so a bad config entry can't break the lock
			continue;
		}
		matches.forEach(element => {
			if (element instanceof HTMLElement && !seen.has(element)) {
				seen.add(element);
				nodes.push(element);
			}
		});
	}

	return nodes;
};

/** Two shard lists are equal when they hold the same elements in the same order. */
export const sameShardNodes = (a: readonly HTMLElement[], b: readonly HTMLElement[]): boolean =>
	a.length === b.length && a.every((element, index) => element === b[index]);
