import React, { FC, useEffect, useState } from "react";

export interface LiveRegionMessage {
	id: string;
	text: string;
}

// How long announced text stays in the DOM. Screen-reader users browsing the
// window later would otherwise read long-gone status text; removing the node
// is silent (removals are not announced under aria-relevant="additions text").
const CLEAR_DELAY_MS = 15000;

interface SrOnlyLiveRegionProps {
	id: string;
	message: LiveRegionMessage | null;
	role?: "status";
}

/**
 * Shared visually-hidden live region body (WCAG 4.1.3 Status Messages).
 *
 * A live region only announces changes to a node that is already in the
 * accessibility tree, so mount this (empty) before the first announcement —
 * never together with its content. Each new `message` is announced once and
 * cleared from the DOM after 15s.
 *
 * Used by <ScreenReaderLiveRegion> (chat messages) and <StatusLiveRegion>
 * (toasts + screen changes); they stay separate DOM regions so simultaneous
 * announcements queue instead of overwriting each other.
 *
 * The text is deliberately committed via state in an effect — one commit
 * after the `message` prop changes — rather than rendered directly from the
 * prop. That guarantees the (empty) region exists in the accessibility tree
 * strictly before its content appears; don't "optimise" this back into a
 * derived render.
 */
export const SrOnlyLiveRegion: FC<SrOnlyLiveRegionProps> = ({ id, message, role }) => {
	const [displayed, setDisplayed] = useState<LiveRegionMessage | null>(null);

	useEffect(() => {
		setDisplayed(message);
		if (!message) return;

		const clearTimer = setTimeout(() => setDisplayed(null), CLEAR_DELAY_MS);
		return () => clearTimeout(clearTimer);
	}, [message]);

	return (
		<div
			role={role}
			aria-live="polite"
			aria-relevant="additions text"
			aria-atomic="true"
			id={id}
			className="sr-only"
		>
			{displayed && <div key={displayed.id}>{displayed.text}</div>}
		</div>
	);
};
