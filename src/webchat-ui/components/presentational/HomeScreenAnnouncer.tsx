import { FC, useEffect } from "react";
import { announceStatus } from "./StatusLiveRegion";

// Delayed until after the slide transition (500ms) and any focus move the
// appearing screen performs (home screen close button: 450ms), so the
// announcement follows the focus utterance instead of being cancelled by it.
const ANNOUNCE_DELAY_MS = 600;

/**
 * Announces the home screen's title through the status live region when
 * the screen visually appears (webchat opened onto it, or navigation
 * from another screen, CGY-3276). Focus lands on the close button, which
 * alone would not tell screen-reader users which screen they are on.
 * (The chat screen's AI-agent notice announces through the chat log's
 * ScreenReaderLiveRegion instead — see docs/accessibility.md.)
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
