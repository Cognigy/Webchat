import React, { FC, useEffect, useState } from "react";
import { SrOnlyLiveRegion, LiveRegionMessage } from "./SrOnlyLiveRegion";

let teaserAnnouncementCounter = 0;

/**
 * Announces the teaser message popup when it appears next to the toggle
 * button (WCAG 4.1.3 Status Messages, CGY-3270). The teaser shows while the
 * webchat is CLOSED, so it cannot announce through <StatusLiveRegion> —
 * that region lives inside the open chat window and is unmounted at that
 * point. This announcer therefore owns a separate region that is mounted
 * with the toggle button for the whole page lifetime, so it pre-exists any
 * teaser (a live region only announces changes to a node already in the
 * accessibility tree — an `aria-live` attribute on the teaser bubble itself
 * mounts together with its content and is never voiced).
 *
 * role="status" (polite), not role="alert": a proactive teaser is advisory
 * and must not interrupt what the user is currently doing on the host page.
 *
 * Announces again when the preview text changes while the teaser is showing
 * (a newer bot message replaces the preview). Hiding the teaser (dismissed,
 * chat opened) clears the region silently so users browsing the page later
 * don't find stale preview text.
 */
const TeaserMessageAnnouncer: FC<{ active: boolean; text: string; label: string }> = ({
	active,
	text,
	label,
}) => {
	const [message, setMessage] = useState<LiveRegionMessage | null>(null);

	useEffect(() => {
		if (!active || !text) {
			setMessage(null);
			return;
		}
		setMessage({
			id: `webchatTeaserMessage-${++teaserAnnouncementCounter}`,
			text: `${label}: ${text}`,
		});
	}, [active, text, label]);

	return <SrOnlyLiveRegion id="webchatTeaserMessageLiveRegion" role="status" message={message} />;
};

export default TeaserMessageAnnouncer;
