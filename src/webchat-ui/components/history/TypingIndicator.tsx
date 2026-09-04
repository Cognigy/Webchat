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
	//
	// The delay counts continuous typing ("active"): typing stopping (typingOff,
	// or an output removing the indicator) cancels the pending announcement,
	// resuming restarts it. The indicator's visible hide tail (`delay`) is not
	// typing, so nothing can be announced after the reply has already landed.
	//
	// The emitted announcement lives as long as the indicator is visible: at
	// most one per visible session, so typing flapping off/on between queued
	// delayed messages of one bot turn doesn't re-announce. When the indicator
	// hides, the text is removed silently (removals aren't announced) so it
	// can't be read later as stale status. Typing-stopped itself is not
	// announced — the arriving message covers it.
	const hasAnnouncedRef = useRef(false);

	useEffect(() => {
		if (isVisible) return;

		hasAnnouncedRef.current = false;
		setAnnouncement(null);
	}, [isVisible]);

	useEffect(() => {
		if (!active || hasAnnouncedRef.current) return;

		const timeout = setTimeout(() => {
			hasAnnouncedRef.current = true;
			setAnnouncement({
				id: `typing-${++announcementCounter}`,
				text: announcementTextRef.current ?? "A reply is being typed",
			});
		}, ANNOUNCE_DELAY_MS);

		return () => clearTimeout(timeout);
	}, [active]);

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
