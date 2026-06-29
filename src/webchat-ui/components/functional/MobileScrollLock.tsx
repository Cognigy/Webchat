import React, { useEffect, useState } from "react";
import { RemoveScroll } from "react-remove-scroll";
import {
	DEFAULT_SCROLL_LOCK_ALLOW_SELECTORS,
	resolveScrollLockShards,
	sameShardNodes,
} from "../../utils/scrollLockShards";

interface MobileScrollLockProps {
	/** When true, scrolling of the host page is locked (mobile fullscreen webchat). */
	enabled: boolean;
	/**
	 * Additional host-page selectors that should stay scrollable while locked,
	 * on top of the built-in consent-manager defaults.
	 */
	allowSelectors?: string[];
	children: React.ReactNode;
}

/**
 * Wraps the webchat in react-remove-scroll to lock host-page scrolling while the
 * widget is open fullscreen on mobile. Host-page overlays whose selectors match
 * the built-in consent-manager list (or `allowSelectors`) are passed as `shards`
 * so their own internal scrolling keeps working — otherwise e.g. a cookie-consent
 * banner shown over the page becomes impossible to scroll/dismiss.
 *
 * Consent managers are often injected after the widget mounts (e.g. via a tag
 * manager) and toggle their banner in and out, so the shard set is resolved live
 * via a MutationObserver while the lock is active.
 */
export const MobileScrollLock = ({ enabled, allowSelectors, children }: MobileScrollLockProps) => {
	const [shards, setShards] = useState<HTMLElement[]>([]);

	// Stable dependency: the effect only needs to re-run when the selector set changes.
	const selectorsKey = (allowSelectors ?? []).join("|");

	useEffect(() => {
		if (!enabled || typeof document === "undefined") {
			setShards(prev => (prev.length === 0 ? prev : []));
			return;
		}

		const selectors = [...DEFAULT_SCROLL_LOCK_ALLOW_SELECTORS, ...(allowSelectors ?? [])];
		const resolve = () =>
			setShards(prev => {
				const next = resolveScrollLockShards(selectors);
				return sameShardNodes(prev, next) ? prev : next;
			});

		resolve();

		let frame: number | null = null;
		const observer = new MutationObserver(() => {
			// Coalesce bursts of host-page mutations into at most one resolve per frame.
			if (frame !== null) return;
			frame = requestAnimationFrame(() => {
				frame = null;
				resolve();
			});
		});
		// Observe the whole document, not just <body>, so overlays mounted directly
		// under <html> (rare, but some consent managers do this) are still detected.
		observer.observe(document.documentElement, { childList: true, subtree: true });

		return () => {
			observer.disconnect();
			if (frame !== null) cancelAnimationFrame(frame);
		};
	}, [enabled, selectorsKey]);

	return (
		<RemoveScroll enabled={enabled} allowPinchZoom={true} shards={shards}>
			{children}
		</RemoveScroll>
	);
};

export default MobileScrollLock;
