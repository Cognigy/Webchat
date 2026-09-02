import React, { FC, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { TypingIndicator as ComponentsTypingIndicator } from "@cognigy/chat-components";

import { useIsMounted } from "../../utils/is-mounted";
import { TSourceDirection } from "../../../common/interfaces/webchat-config";
import { SrOnlyLiveRegion, LiveRegionMessage } from "../presentational/SrOnlyLiveRegion";

interface ITypingIndicatorProps {
	active: boolean;
	delay?: number;
	direction?: TSourceDirection;
	disableBorder?: boolean;
	announcementText?: string;
}

// How long typing must be continuously visible before it is announced to
// screen readers (CGY-3146). Short bursts stay silent on purpose: when the
// reply lands within this window, its own announcement (through
// <ScreenReaderLiveRegion>) supersedes a "typing" heads-up, which would only
// add noise to the polite queue.
const ANNOUNCE_DELAY_MS = 2000;

// Module-global so every typing session gets a fresh LiveRegionMessage id —
// a repeated announcement with the same text still needs a new node to be
// re-announced (see SrOnlyLiveRegion's keying).
let announcementCounter = 0;

const ChatTypingIndicator = styled(ComponentsTypingIndicator)({
	marginBlock: 0,
});

const HiddenChatTypingIndicator = styled(ChatTypingIndicator)({
	visibility: "hidden",
});

const TypingIndicator: FC<ITypingIndicatorProps> = props => {
	const { active, delay, direction, disableBorder, announcementText } = props;

	const isMounted = useIsMounted();

	/**
	 * "isVisible" is a debounced copy of "active",
	 * which will switch to "true" immediately, but only
	 * switch to "false" after a certain "debounce time"
	 *
	 * Example Timeline: (- is false, + is true)
	 * -----+++--++++++---++++------------++++-----
	 * would become
	 * -----++++++++++++++++++++++--------++++++++-
	 */
	const [isVisible, setIsVisible] = useState(active);

	const [announcement, setAnnouncement] = useState<LiveRegionMessage | null>(null);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;

		if (active) {
			setIsVisible(active);
		} else {
			timeout = setTimeout(() => {
				if (isMounted.current) setIsVisible(false);
			}, delay || 500);
		}

		return () => {
			if (timeout) clearTimeout(timeout);
		};
	}, [active]);

	// Read at fire time through a ref so a translations/config update while
	// typing is visible neither restarts the delay nor emits a duplicate
	// announcement mid-session.
	const announcementTextRef = useRef(announcementText);
	announcementTextRef.current = announcementText;

	// Announce a sustained typing session once (WCAG 4.1.3 Status Messages).
	// Keyed off the debounced "isVisible" so on/off flapping within the hide
	// tail neither restarts the delay nor re-announces. When typing ends, the
	// announcement is removed silently (removals aren't announced) so users
	// browsing the window later don't read stale "typing" text; typing-stopped
	// itself is deliberately not announced — the arriving message covers it.
	useEffect(() => {
		if (!isVisible) {
			setAnnouncement(null);
			return;
		}

		const timeout = setTimeout(() => {
			setAnnouncement({
				id: `typing-${++announcementCounter}`,
				text: announcementTextRef.current ?? "A reply is being typed",
			});
		}, ANNOUNCE_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [isVisible]);

	return (
		<>
			{/* Sibling of the indicator, never a child: the hidden indicator's
			    visibility:hidden would drop a nested region from the
			    accessibility tree, and a live region must pre-exist its
			    content to be announced. */}
			<SrOnlyLiveRegion
				id="webchatTypingIndicatorLiveRegion"
				role="status"
				message={announcement}
			/>
			{isVisible ? (
				<ChatTypingIndicator direction={direction} disableBorder={disableBorder} />
			) : (
				<HiddenChatTypingIndicator />
			)}
		</>
	);
};

export default TypingIndicator;
