import { FC, useEffect, useRef } from "react";
import { announceStatus } from "./StatusLiveRegion";

// Delayed until after the slide transition (500ms) and any focus move the
// appearing screen performs (home screen close button: 450ms; chat screen
// message input: autofocus on mount), so the announcement follows the focus
// utterance instead of being cancelled by it.
const ANNOUNCE_DELAY_MS = 600;

/**
 * Announces a screen's context through the status live region when that
 * screen visually appears (webchat opened onto it, or navigation from
 * another screen). Focus lands on a control inside the appearing screen
 * (home screen: close button; chat screen: message input), which alone
 * would not tell screen-reader users which screen they are on.
 *
 * Used for the home screen title (CGY-3276) and the chat screen's AI-agent
 * notice (CGY-3519).
 *
 * The effect cleanup cancels the pending announcement if the user closes
 * the webchat or navigates away within the delay.
 *
 * `once` limits the announcement to the screen's first appearance per mount.
 * The announcer lives inside the open chat window (like the status region it
 * feeds), so closing and reopening the webchat announces again — but
 * navigating away and back within one open window stays silent. A cancelled
 * announcement (navigated away within the delay) does not count as made.
 */
const ScreenAnnouncer: FC<{ active: boolean; label: string; once?: boolean }> = ({
	active,
	label,
	once,
}) => {
	const hasAnnouncedRef = useRef(false);

	useEffect(() => {
		if (!active || (once && hasAnnouncedRef.current)) return;

		const announceTimeout = setTimeout(() => {
			hasAnnouncedRef.current = true;
			announceStatus(label);
		}, ANNOUNCE_DELAY_MS);
		return () => clearTimeout(announceTimeout);
	}, [active, label, once]);

	return null;
};

export default ScreenAnnouncer;
