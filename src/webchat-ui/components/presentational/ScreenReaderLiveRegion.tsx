import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "../../../webchat/helper/useSelector";
import { cleanUpText, getTextFromDOM } from "../../utils/live-region-announcement";
import getMessagesListWithoutControlCommands from "../../utils/filter-out-control-commands";
import { IStreamingMessage } from "../../../common/interfaces/message";
import { SrOnlyLiveRegion, LiveRegionMessage } from "./SrOnlyLiveRegion";

interface ScreenReaderLiveRegionProps {
	liveContent: Record<string, string>;
	/**
	 * Intro text (the AI-agent notice, CGY-3519) announced BEFORE any
	 * message announcement: while the intro is pending, message
	 * announcements hold, so the live-region mutations always reach the
	 * screen reader in intro-first order. Undefined when nothing should be
	 * announced (notice disabled, reopened previous conversation,
	 * disconnect overlay open, or already announced).
	 */
	introText?: string;
	/** Identity of the intro (the session's announce key) — a changed key announces again. */
	introKey?: string;
	/** Called when the intro was actually announced (not cancelled), so the parent can mark it done across remounts. */
	onIntroAnnounced?: (introKey: string) => void;
}

// Intro announcements are deferred past the chat screen's own utterances
// (input autofocus on mount, focus restore after the disconnect overlay
// closes) — live text inserted in the same breath as a focus move gets the
// polite announcement cancelled. Messages don't need this: network latency
// keeps them clear of the mount, and the intro hold below keeps them in
// order.
const INTRO_ANNOUNCE_DELAY_MS = 600;

const ScreenReaderLiveRegion: React.FC<ScreenReaderLiveRegionProps> = ({
	liveContent,
	introText,
	introKey,
	onIntroAnnounced,
}) => {
	const [liveMessage, setLiveMessage] = useState<LiveRegionMessage | null>(null);
	const [introMessage, setIntroMessage] = useState<LiveRegionMessage | null>(null);
	const [announcedIntroKey, setAnnouncedIntroKey] = useState<string | null>(null);
	const messageHistory = useSelector(state => state.messages.messageHistory);
	const messages = getMessagesListWithoutControlCommands(messageHistory, ["acceptPrivacyPolicy"]);
	const announcedIdsRef = useRef<Set<string>>(new Set());
	const isProgressiveRenderingEnabled = useSelector(
		state => state.config.settings.behavior?.progressiveMessageRendering,
	);

	// The intro claims the first announcement slot: while it is pending, the
	// message effect below holds (and re-runs when the pending state flips).
	const introPending = !!introText && introKey !== announcedIntroKey;

	useEffect(() => {
		if (!introPending || !introText) return;

		const introTimeout = setTimeout(() => {
			setIntroMessage({
				id: `webchatAIAgentNotice-${introKey}`,
				text: cleanUpText(introText),
			});
			setAnnouncedIntroKey(introKey ?? "");
			onIntroAnnounced?.(introKey ?? "");
		}, INTRO_ANNOUNCE_DELAY_MS);
		return () => clearTimeout(introTimeout);
	}, [introPending, introText, introKey, onIntroAnnounced]);

	useEffect(() => {
		if (introPending) return;
		if (!messages.length) return;

		const unannouncedMessages = messages.filter(msg => {
			const id = `webchatMessageId-${msg.timestamp}`;
			return !announcedIdsRef.current.has(id);
		});

		if (!unannouncedMessages.length) return;

		const isStreamingMessage = (message: unknown): message is IStreamingMessage => {
			return message !== null && typeof message === "object" && "animationState" in message;
		};

		const timeout = setTimeout(() => {
			// Scan for the first unannounced message that is currently announceable.
			// We must NOT stop at index 0 for non-rendered (data-only) messages,
			// otherwise a permanently data-only message would block all later ones.
			for (const candidate of unannouncedMessages) {
				const id = `webchatMessageId-${candidate.timestamp}`;

				// A streaming message that hasn't finished blocks later announcements
				// (preserves in-order announcement of streamed output).
				const isStreaming =
					isProgressiveRenderingEnabled &&
					isStreamingMessage(candidate) &&
					(candidate.animationState === "start" ||
						candidate.animationState === "animating");
				if (isStreaming) return;

				// Event status pills announce themselves via aria-live="assertive".
				// Mark handled and continue; they must not block later real messages.
				if (liveContent[id] === `IGNORE-${id}`) {
					announcedIdsRef.current.add(id);
					continue;
				}

				// Prefer chat-components' live content; otherwise read the DOM.
				// getTextFromDOM returns null when no <article data-message-id>
				// node exists, which is the signal for a not-rendered message.
				const liveText = liveContent[id];
				const domText = liveText ? null : getTextFromDOM(id);

				// "Rendered" iff chat-components produced live content for it,
				// or an <article data-message-id> node exists in the DOM.
				const isRendered = Boolean(liveText) || domText !== null;

				// Data-only / unsupported message: not in the chat log UI.
				// Skip WITHOUT marking announced so it can still be announced
				// if it becomes rendered later (e.g. progressive rendering).
				if (!isRendered) {
					continue;
				}

				// Rendered: announce exactly one message per effect run.
				// Fall back to "A new message" for rendered-but-textless nodes.
				announcedIdsRef.current.add(id);
				const text = cleanUpText(liveText || domText || "A new message");
				setLiveMessage({ id, text });
				return;
			}
		}, 100);

		return () => clearTimeout(timeout);
	}, [messages, liveContent, isProgressiveRenderingEnabled, introPending]);

	return (
		<>
			<SrOnlyLiveRegion
				id="webchatMessageContainerScreenReaderLiveRegion"
				message={liveMessage}
			/>
			{/* The intro gets its OWN region: the message region shows one
			    child at a time, so the next message announcement would
			    REPLACE the intro's node — and NVDA silently drops a queued
			    polite announcement whose node has left the DOM before it is
			    processed (observed on session switches, where the overlay
			    utterances keep NVDA's queue busy). A sibling region means
			    nothing ever replaces the intro; the announcement ORDER is
			    still guaranteed by the intro hold above, which sequences the
			    DOM mutations (intro first, messages after). */}
			<SrOnlyLiveRegion id="webchatAIAgentNoticeLiveRegion" message={introMessage} />
		</>
	);
};

export default ScreenReaderLiveRegion;
