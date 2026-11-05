import React, { forwardRef, useEffect, useRef, useState } from "react";

export interface LiveRegionMessage {
	id: string;
	text: string;
}

// How long announced text stays in the DOM. Screen-reader users browsing the
// window later would otherwise read long-gone status text; removing the node
// is silent (removals are not announced under aria-relevant="additions text").
const CLEAR_DELAY_MS = 15000;

/**
 * How successive messages share the region:
 * - "replace" (default): one node at a time — the next message swaps the
 *   node out. Right for regions whose messages supersede each other (chat
 *   log, typing indicator, unread count, teaser).
 * - "append": every message gets its own node, kept until its own 15s clear,
 *   and the region is not atomic so only the added node is voiced. Right for
 *   independent status messages that may land moments apart: a swap removes
 *   the previous node, and NVDA drops a queued polite announcement whose
 *   node left the DOM before it was voiced — the earlier message would be
 *   lost. The clear is per message, so browsing users still never meet
 *   text older than 15s.
 */
export type LiveRegionMode = "replace" | "append";

interface SrOnlyLiveRegionProps {
	id: string;
	message: LiveRegionMessage | null;
	role?: "status";
	mode?: LiveRegionMode;
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
 * (toasts + screen changes + upload outcomes); they stay separate DOM regions
 * so simultaneous announcements queue instead of overwriting each other.
 *
 * The text is deliberately committed via state in an effect — one commit
 * after the `message` prop changes — rather than rendered directly from the
 * prop. That guarantees the (empty) region exists in the accessibility tree
 * strictly before its content appears; don't "optimise" this back into a
 * derived render.
 */
export const SrOnlyLiveRegion = forwardRef<HTMLDivElement, SrOnlyLiveRegionProps>(
	({ id, message, role, mode = "replace" }, ref) => {
		const [displayed, setDisplayed] = useState<LiveRegionMessage[]>([]);
		// append mode: one clear timer per message, all cancelled on unmount
		const clearTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

		useEffect(() => {
			if (mode === "replace") {
				setDisplayed(message ? [message] : []);
				if (!message) return;

				const clearTimer = setTimeout(() => setDisplayed([]), CLEAR_DELAY_MS);
				return () => clearTimeout(clearTimer);
			}

			if (!message) return;
			const { id: messageId } = message;
			setDisplayed(previous =>
				previous.some(item => item.id === messageId) ? previous : [...previous, message],
			);
			const clearTimer = setTimeout(() => {
				clearTimersRef.current.delete(messageId);
				setDisplayed(previous => previous.filter(item => item.id !== messageId));
			}, CLEAR_DELAY_MS);
			clearTimersRef.current.set(messageId, clearTimer);
		}, [message, mode]);

		useEffect(() => {
			const clearTimers = clearTimersRef.current;
			return () => {
				clearTimers.forEach(clearTimeout);
				clearTimers.clear();
			};
		}, []);

		return (
			<div
				ref={ref}
				role={role}
				aria-live="polite"
				aria-relevant="additions text"
				aria-atomic={mode === "replace" ? "true" : "false"}
				id={id}
				className="sr-only"
			>
				{displayed.map(item => (
					<div key={item.id}>{item.text}</div>
				))}
			</div>
		);
	},
);

SrOnlyLiveRegion.displayName = "SrOnlyLiveRegion";
