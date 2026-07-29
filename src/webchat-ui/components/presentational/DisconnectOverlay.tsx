import React, { useEffect, useRef, useState } from "react";

import Modal from "../Modal/Modal";
import Button from "./Button";

import { IWebchatConfig } from "../../../common/interfaces/webchat-config";

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

	// Live announcements for state *changes*, reusing the already-localized
	// overlay strings. This region lives outside the dialog (and outlives it),
	// so it can announce "connection restored" after the dialog has closed.
	// The dialog's initial appearance is deliberately not announced here —
	// screen readers already announce the dialog itself.
	const [announcement, setAnnouncement] = useState("");
	const prevStateRef = useRef({ isOpen, isPermanent, isConnecting });
	useEffect(() => {
		const prev = prevStateRef.current;
		prevStateRef.current = { isOpen, isPermanent, isConnecting };

		if (!prev.isOpen && isOpen) return; // opening is announced by the dialog
		if (prev.isOpen && !isOpen) {
			setAnnouncement(connectionRestoredText);
			return;
		}
		if (!isOpen) return;

		if (!prev.isConnecting && isConnecting) {
			setAnnouncement(reconnectingText);
		} else if (prev.isConnecting && !isConnecting) {
			// A manual reconnection attempt ended while still disconnected
			setAnnouncement(networkErrorText);
		} else if (!prev.isPermanent && isPermanent) {
			// Automatic reconnection gave up.
			if (!showReconnect) {
				setAnnouncement(noNetworkText);
				return;
			}
			// Announce the transition through the live region — a programmatic
			// focus move to a freshly inserted control is not reliably announced
			// by screen readers, even deferred, so the focus move below is a
			// convenience while this announcement is the guaranteed signal.
			setAnnouncement(`${networkErrorText}. ${reconnectText}`);
			// Move focus to the newly appeared Reconnect action. Deferred so
			// the screen reader ingests the inserted button before the focus
			// event, and guarded so it only happens while focus still sits on
			// the overlay's close button — never yanking focus from a
			// navigating user (SC 3.2.1).
			const focusTimer = setTimeout(() => {
				const active = document.activeElement;
				if (active?.hasAttribute("data-disconnect-overlay-close-button")) {
					reconnectRef.current?.focus();
				}
			}, 500);
			return () => clearTimeout(focusTimer);
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
		onConnect();
	};

	// Visible status line. The idle permanent state shows no status text (just
	// the Reconnect action).
	const getStatusText = () => {
		if (isConnecting || !isPermanent) return reconnectingText;
		if (!navigator.onLine) return noNetworkText;
		return null;
	};

	return (
		<>
			<div role="status" className="sr-only">
				{announcement}
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
				{getStatusText() && (
					<div className="webchat-disconnect-overlay-status">{getStatusText()}</div>
				)}
				{showReconnect && (
					<Button
						ref={reconnectRef}
						onClick={handleReconnect}
						color="primary"
						aria-disabled={isConnecting}
						style={isConnecting ? { opacity: 0.6 } : undefined}
					>
						{reconnectText}
					</Button>
				)}
			</Modal>
		</>
	);
};

export default DisconnectOverlay;
