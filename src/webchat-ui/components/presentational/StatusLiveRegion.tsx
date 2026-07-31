import React, { FC, useEffect, useRef, useState } from "react";
import { useToasterStore } from "react-hot-toast";
import { SrOnlyLiveRegion, LiveRegionMessage } from "./SrOnlyLiveRegion";

type StatusListener = (text: string) => void;
const statusListeners = new Set<StatusListener>();
let statusCounter = 0;

/**
 * Announces arbitrary status text (e.g. a screen change) through the
 * <StatusLiveRegion>. No-op while the region is not mounted (webchat closed).
 */
export function announceStatus(text: string) {
	statusListeners.forEach(listener => listener(text));
}

/**
 * Screen-reader status live region (WCAG 4.1.3 Status Messages), mounted for
 * the lifetime of the open chat window — so it exists in the DOM before
 * anything it announces (live regions only announce changes to nodes already
 * in the accessibility tree). Closing the webchat unmounts it: announcements
 * made while closed are dropped, and a persistent notification still visible
 * after reopening is announced again.
 *
 * Input sources:
 * - toast notifications: react-hot-toast adds the toast (and its
 *   role="status" wrapper) to the DOM only when the notification fires,
 *   which live-region processing ignores — so toasts are mirrored here and
 *   silenced at the source (see silencedAriaProps in Notifications.tsx);
 * - direct announcements via announceStatus() (e.g. "home screen appeared").
 */
export const StatusLiveRegion: FC = () => {
	const { toasts } = useToasterStore();
	const announcedIdsRef = useRef<Set<string>>(new Set());
	const [status, setStatus] = useState<LiveRegionMessage | null>(null);

	useEffect(() => {
		const listener = (text: string) => setStatus({ id: `status-${++statusCounter}`, text });
		statusListeners.add(listener);
		return () => {
			statusListeners.delete(listener);
		};
	}, []);

	useEffect(() => {
		// Forget ids that left the toast store so the set cannot grow unbounded
		const liveToastIds = new Set(toasts.map(t => t.id));
		announcedIdsRef.current.forEach(id => {
			if (!liveToastIds.has(id)) announcedIdsRef.current.delete(id);
		});

		const unannounced = toasts.filter(
			t => t.visible && !announcedIdsRef.current.has(t.id) && typeof t.message === "string",
		);
		if (!unannounced.length) return;

		unannounced.forEach(t => announcedIdsRef.current.add(t.id));

		// Announce the most recent notification when several land in one
		// render. Sorted explicitly: react-hot-toast prepends new toasts, so
		// relying on array order silently picks the oldest (CGY-34519).
		const latest = unannounced.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
		setStatus({ id: latest.id, text: latest.message as string });
	}, [toasts]);

	return <SrOnlyLiveRegion id="webchatStatusLiveRegion" role="status" message={status} />;
};

export default StatusLiveRegion;
