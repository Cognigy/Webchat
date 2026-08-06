import { FC, useEffect } from "react";
import { announceStatus } from "./StatusLiveRegion";

// Delayed until after the slide transition (500ms) and the close-button
// focus (450ms), so the announcement follows the focus utterance instead
// of being cancelled by it.
const ANNOUNCE_DELAY_MS = 600;

/**
 * Announces the home screen title through the status live region when the
 * home screen visually appears (webchat opened onto it, or back-navigation
 * from another screen). Focus lands on the home screen's close button,
 * which alone would not tell screen-reader users which screen they are on
 * — the home screen has no guaranteed visible title to focus instead.
 *
 * The effect cleanup cancels the pending announcement if the user closes
 * the webchat or navigates away within the delay.
 */
const HomeScreenAnnouncer: FC<{ active: boolean; label: string }> = ({ active, label }) => {
	useEffect(() => {
		if (!active) return;

		const announceTimeout = setTimeout(() => announceStatus(label), ANNOUNCE_DELAY_MS);
		return () => clearTimeout(announceTimeout);
	}, [active, label]);

	return null;
};

export default HomeScreenAnnouncer;
