import React, { useEffect, useRef, useState } from "react";

import styled from "@emotion/styled";

import Modal from "../Modal/Modal";
import Button from "./Button";

import { IWebchatConfig } from "../../../common/interfaces/webchat-config";

// aria-disabled (not disabled) so the running state stays focusable and
// announceable; the dimming therefore can't come from Button's `&:disabled`.
const ReconnectButton = styled(Button)({
	"&[aria-disabled='true']": { opacity: 0.6 },
});

interface DisconnectOverlayProps {
	isOpen: boolean;
	isPermanent: boolean;
	isConnecting: boolean;
	onClose: () => void;
	onConnect: () => void;
	config: IWebchatConfig;
}

/**
 * Blocking connection-lost state of the chat window. A fullscreen Modal so
 * closing it visibly means closing the chat window — matching the close
 * button's accessible name. The chat layout behind it is aria-hidden + inert
 * while open (see DisconnectableContentWrapper in WebchatUI).
 */
const DisconnectOverlay = (props: DisconnectOverlayProps) => {
	const { isPermanent, isConnecting, onClose, onConnect, config, isOpen } = props;

	// Focus the primary Reconnect action on open when it is rendered;
	// the Modal falls back to its close button otherwise.
	const reconnectRef = useRef<HTMLButtonElement>(null);

	const showReconnect = isPermanent && navigator.onLine;

	const networkErrorText = config.settings.customTranslations?.network_error ?? "Connection lost";
	const reconnectingText = config.settings.customTranslations?.reconnecting ?? "Reconnecting...";
	const noNetworkText = config.settings.customTranslations?.no_network ?? "No network connection";
	const reconnectText = config.settings.customTranslations?.reconnect ?? "Reconnect";
	const connectionRestoredText =
		config.settings.customTranslations?.connection_restored ?? "Connection restored.";

	// Live announcements reusing the already-localized overlay strings, split
	// across two regions because VoiceOver prunes the accessibility tree
	// outside an aria-modal dialog:
	// - `announcement` renders in a region INSIDE the dialog body — the only
	//   place VoiceOver honors live updates while the modal is open.
	// - `closedAnnouncement` renders in a region OUTSIDE the dialog (it
	//   outlives it), for "connection restored" after the dialog has closed —
	//   at that point the tree is no longer pruned.
	const [announcement, setAnnouncement] = useState("");
	const [closedAnnouncement, setClosedAnnouncement] = useState("");
	// The dialog announcement covers only its accessible name ("Connection
	// lost") — VoiceOver does not read the status text in the dialog body, so
	// the reconnecting phase would pass in silence (SC 4.1.3 Status Messages).
	// Announce the status on open — but never the dialog title, which the
	// dialog already announces. Deferred past the Modal's ~200ms initial-focus
	// move so the polite message queues after the dialog/focus announcement
	// instead of being coalesced into it. Deliberately a separate effect keyed
	// on `isOpen` alone, reading the rest at fire time from a ref: inside the
	// transition effect below, any connection-state flip within the deferral
	// window would re-run the effect and its cleanup would cancel the pending
	// announcement.
	const openStatusRef = useRef({ isConnecting, isPermanent, reconnectingText, noNetworkText });
	openStatusRef.current = { isConnecting, isPermanent, reconnectingText, noNetworkText };
	useEffect(() => {
		if (!isOpen) return;
		const openTimer = setTimeout(() => {
			const current = openStatusRef.current;
			const statusText =
				current.isConnecting || !current.isPermanent
					? current.reconnectingText
					: !navigator.onLine
						? current.noNetworkText
						: null; // idle permanent state: the focused Reconnect button announces itself
			if (statusText) setAnnouncement(statusText);
		}, 300);
		return () => clearTimeout(openTimer);
	}, [isOpen]);

	const prevStateRef = useRef({ isOpen, isPermanent, isConnecting });
	useEffect(() => {
		const prev = prevStateRef.current;
		prevStateRef.current = { isOpen, isPermanent, isConnecting };

		if (!prev.isOpen && isOpen) {
			// Opening is announced by the effect above. Clear the outside region:
			// setting it to the same "Connection restored." string on the next
			// close would otherwise be a React no-op (no DOM mutation), leaving
			// every restore after the first unannounced.
			setClosedAnnouncement("");
			return;
		}
		if (prev.isOpen && !isOpen) {
			setClosedAnnouncement(connectionRestoredText);
			// Clear the in-dialog region so a later reopen doesn't remount the
			// dialog with stale text sitting in a live region (content present
			// at insertion can be spuriously announced).
			setAnnouncement("");
			return;
		}
		if (!isOpen) return;

		// The permanent transition is checked first: `connecting` can flip in
		// the same commit (e.g. a CONNECT dispatched on tab re-focus rejecting
		// just as the retry limit is hit) and must not swallow the focus move
		// below.
		if (!prev.isPermanent && isPermanent) {
			// Automatic reconnection gave up.
			if (!showReconnect) {
				setAnnouncement(noNetworkText);
				return;
			}
			// Move focus to the newly appeared Reconnect action. Deferred so
			// the screen reader ingests the inserted button before the focus
			// event (focusing in the same task the node was inserted is not
			// announced), and guarded so it only happens while focus still
			// sits on the overlay's close button — never yanking focus from a
			// navigating user (SC 3.2.1). The focus move announces the button;
			// when the guard skips it, the live region announces the label
			// instead, so the transition is announced exactly once either way.
			const focusTimer = setTimeout(() => {
				const active = document.activeElement;
				if (active?.hasAttribute("data-disconnect-overlay-close-button")) {
					reconnectRef.current?.focus();
					// Clear the region (emptying is not announced) so the focus
					// announcement stays the only output here, and so a later
					// manual-reconnect announcement is a fresh text mutation even
					// when it repeats the last announced string.
					setAnnouncement("");
				} else {
					setAnnouncement(reconnectText);
				}
			}, 500);
			return () => clearTimeout(focusTimer);
		}
		// The `connecting` transitions are only announced in the permanent
		// state, where they reflect a *manual* reconnection attempt. During the
		// automatic-retry phase the flag flips on every retry cycle — announcing
		// each flip would alternate "Reconnecting…"/"Connection lost" as pure
		// noise while the status ("Reconnecting…", announced on open) hasn't
		// actually changed.
		else if (!prev.isConnecting && isConnecting && isPermanent) {
			setAnnouncement(reconnectingText);
		} else if (prev.isConnecting && !isConnecting && isPermanent) {
			// A manual reconnection attempt ended while still disconnected
			setAnnouncement(networkErrorText);
		}
	}, [
		isOpen,
		isPermanent,
		isConnecting,
		showReconnect,
		networkErrorText,
		reconnectingText,
		noNetworkText,
		reconnectText,
		connectionRestoredText,
	]);

	const handleReconnect = () => {
		if (isConnecting) return;
		// Announce the attempt directly on activation — deterministic for
		// assistive tech regardless of when (or whether) the store's
		// `connecting` flag transition is observed by the effect above.
		setAnnouncement(reconnectingText);
		onConnect();
	};

	// Visible status line. The idle permanent state shows no status text (just
	// the Reconnect action).
	const statusText =
		isConnecting || !isPermanent ? reconnectingText : !navigator.onLine ? noNetworkText : null;

	return (
		<>
			<div role="status" className="sr-only">
				{closedAnnouncement}
			</div>
			<Modal
				variant="fullscreen"
				isOpen={isOpen}
				onClose={() => onClose()}
				title={networkErrorText}
				titleId="webchatDisconnectOverlayTitle"
				closeButtonAriaLabel={
					config.settings.customTranslations?.ariaLabels?.closeConnectionWarning ??
					"Close chat window"
				}
				closeButtonProps={{
					"data-disconnect-overlay-close-button": true,
					className: "webchat-header-close-button",
				}}
				initialFocusRef={reconnectRef}
				className="webchat-disconnect-overlay"
				data-disconnect-overlay
			>
				{/* While the modal is open, VoiceOver only honors live regions
				    inside the aria-modal dialog — everything outside is pruned
				    from its accessibility tree. Mounts empty with the dialog;
				    text is always inserted in a later tick (VoiceOver ignores
				    content already present when a live region enters the DOM). */}
				<div role="status" className="sr-only" data-disconnect-overlay-live-region>
					{announcement}
				</div>
				{statusText && (
					// aria-hidden: the live region above is the single programmatic
					// source of this text. Without this, NVDA reads the visible line
					// in each of its two dialog-entry passes and then hears the live
					// region too — "Reconnecting…" three times.
					<div className="webchat-disconnect-overlay-status" aria-hidden="true">
						{statusText}
					</div>
				)}
				{showReconnect && (
					<ReconnectButton
						ref={reconnectRef}
						onClick={handleReconnect}
						color="primary"
						aria-disabled={isConnecting}
					>
						{reconnectText}
					</ReconnectButton>
				)}
			</Modal>
		</>
	);
};

export default DisconnectOverlay;
