import React, { FC, useEffect, useState } from "react";
import { SrOnlyLiveRegion, LiveRegionMessage } from "./SrOnlyLiveRegion";

let unreadAnnouncementCounter = 0;

/**
 * Announces the unread-message count when it changes (WCAG 4.1.3 Status
 * Messages, technique ARIA22, CGY-3163). Sighted users get this count from
 * the badge on the toggle button and from the page title indicator; neither
 * reaches a screen reader on its own — the badge only changes the toggle
 * button's accessible name (read on focus, never live) and browsers do not
 * announce `document.title` changes at all.
 *
 * Unread messages only accumulate while the chat window is closed or the
 * page is hidden, so <StatusLiveRegion> (inside the open window) cannot
 * carry this. The region is mounted for the page lifetime — next to the
 * toggle button, independent of it — so it pre-exists the first count
 * change (a live region only announces changes to a node already in the
 * accessibility tree).
 *
 * role="status" (polite), not role="alert": a new-message notice is
 * advisory and must not interrupt what the user is doing on the host page.
 *
 * `active` mirrors the visual indicators (badge or title indicator
 * enabled): when neither is shown, screen-reader users are not notified
 * either. Clearing the count (chat opened, page visible again) empties the
 * region silently so users browsing the page later don't find stale text.
 */
const UnreadMessagesAnnouncer: FC<{
	active: boolean;
	count: number;
	singularText: string;
	pluralText: string;
}> = ({ active, count, singularText, pluralText }) => {
	const [message, setMessage] = useState<LiveRegionMessage | null>(null);

	useEffect(() => {
		if (!active || count === 0) {
			setMessage(null);
			return;
		}
		setMessage({
			id: `webchatUnreadMessages-${++unreadAnnouncementCounter}`,
			text: count === 1 ? singularText : `${count} ${pluralText}`,
		});
	}, [active, count, singularText, pluralText]);

	return (
		<SrOnlyLiveRegion id="webchatUnreadMessagesLiveRegion" role="status" message={message} />
	);
};

export default UnreadMessagesAnnouncer;
