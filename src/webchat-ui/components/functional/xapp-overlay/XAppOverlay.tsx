import { useDispatch } from "react-redux";
import React, { FC, useEffect, useRef } from "react";
import styled from "@emotion/styled";

import { addMessage } from "../../../../webchat/store/messages/message-reducer";
import { closeOverlay } from "../../../../webchat/store/xapp-overlay/slice";
import { useOverlaySettingsByUrl } from "../../../../webchat/store/xapp-overlay/hooks";
import { useSelector } from "../../../../webchat/helper/useSelector";
import Header from "../../presentational/Header";
import { sendMessage } from "../../../../webchat/store/messages/message-middleware";
import getKeyboardFocusableElements from "../../../utils/find-focusable";

const TITLE_ID = "webchatXAppOverlayTitle";
const FOCUS_GUARD_ATTRIBUTE = "data-xapp-overlay-focus-guard";

const Root = styled.div(() => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	animation: "fade-in-xapp .25s ease-out",
	"@media (prefers-reduced-motion: reduce)": {
		animation: "none",
	},
	"@keyframes fade-in-xapp": {
		from: {
			transform: "scale(.875)",
			opacity: 0.25,
		},
		to: {
			transform: "scale(1)",
			opacity: 1,
		},
	},
}));

const Iframe = styled.iframe(() => ({
	appearance: "none",
	border: "none",
	height: "100%",
	width: "100%",
	animation: "fade-in-xapp-2 .325s ease-in",
	"@media (prefers-reduced-motion: reduce)": {
		animation: "none",
	},
	"@keyframes fade-in-xapp-2": {
		from: {
			opacity: 0.87,
			transform: "scale(.95)",
			translateY: "-300px",
		},
		to: {
			transform: "scale(1)",
			translateY: 0,
			opacity: 1,
		},
	},
}));

// Visually hidden but reachable by sequential focus navigation. Not
// `aria-hidden`: a focusable aria-hidden node is an axe violation
// (aria-hidden-focus) — and focus never rests here anyway, the onFocus
// handler redirects it immediately.
const FocusGuard = styled.div(() => ({
	position: "absolute",
	width: 1,
	height: 1,
	margin: -1,
	padding: 0,
	overflow: "hidden",
	clip: "rect(0, 0, 0, 0)",
	outline: "none",
}));

const xAppOverlay: FC = () => {
	const url = useSelector(state => state.xAppOverlay.currentUrl) || "";
	const {
		closeOnSubmit,
		feedbackMessage,
		screenTitle,
		sendEventOnCloseIconClick,
		showCloseIcon,
	} = useOverlaySettingsByUrl(url);

	const ariaLabels = useSelector(state => state.config.settings.customTranslations?.ariaLabels);
	// Names the dialog and its frame when the xApp has no screen title.
	const fallbackName = ariaLabels?.xAppOverlay ?? "Embedded app";
	const closeButtonAriaLabel = ariaLabels?.closeDialog ?? "Close dialog";

	const dispatch = useDispatch();
	const rootRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const handleClose = () => {
		if (closeOnSubmit) {
			dispatch(closeOverlay());
		}
	};

	const handleCloseIconClick = () => {
		if (sendEventOnCloseIconClick) {
			dispatch(sendMessage({ data: { type: "xAppClosed" } }));
		}

		dispatch(closeOverlay());
	};

	const handleSubmit = (event: MessageEvent) => {
		// WCH-SI10-004: compare canonical origins, not raw URL strings.
		// The previous url.startsWith(event.origin) check was semantically backwards —
		// a domain that is a string-prefix of url (e.g. "https://xapp.cognigy.a" for
		// "https://xapp.cognigy.ai/form") could pass the check despite being a different
		// origin. new URL(url).origin extracts the canonical scheme+host+port for an
		// exact match, which is the correct cross-origin security boundary.
		let urlOrigin: string;
		try {
			urlOrigin = new URL(url).origin;
		} catch {
			// url is empty or not a valid absolute URL — reject all postMessages.
			return;
		}

		if (urlOrigin !== event.origin) {
			return;
		}

		if (event.data.type !== "x-app-submit") {
			return;
		}

		if (feedbackMessage) {
			const { success = false } = event?.data || {};

			dispatch(
				addMessage({
					source: "user",
					data: {
						_plugin: {
							type: "x-app-submit",
							data: {
								success,
								text: feedbackMessage,
							},
						},
					},
				}),
			);
		}

		handleClose();
	};

	// We receive a MessageEvent from the xApp iframe when submission happens.
	// https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent
	// url and feedbackMessage are included in deps so the handler is re-registered
	// whenever either changes — both affect the handleSubmit closure and can change
	// independently (e.g. a subsequent RECEIVE_MESSAGE can update overlay settings
	// for the same URL, which would change feedbackMessage without changing url).
	useEffect(() => {
		function unsubscribe() {
			window.removeEventListener("message", handleSubmit);
		}

		window.addEventListener("message", handleSubmit);

		return () => {
			unsubscribe();
		};
	}, [closeOnSubmit, url, feedbackMessage]);

	// APG modal dialog: move focus into the dialog once on open — to the
	// close button (the first control, as Modal does), else the frame itself.
	// Deliberately NOT the title: the dialog is named by that heading, so
	// focusing it makes NVDA read the same text as dialog name, as focused
	// heading, and again on its browse-mode pass. Deferred like
	// Modal.initialFocusRef: focusing in the same task that inserted the
	// subtree is not announced by VoiceOver (CGY-3274).
	useEffect(() => {
		const focusTimer = window.setTimeout(() => {
			const root = rootRef.current;
			if (!root || root.closest("[inert]")) return;
			(closeButtonRef.current ?? iframeRef.current)?.focus();
		}, 200);
		return () => window.clearTimeout(focusTimer);
	}, []);

	// Escape dismisses the dialog exactly like the close icon (same side
	// effects), and only when the xApp is dismissable — without a close icon
	// the overlay is a blocking step that ends on submission inside the app.
	// Keys pressed inside the cross-origin frame never reach this document.
	useEffect(() => {
		if (!showCloseIcon) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape") return;
			// Another modal surface (e.g. the disconnect overlay) is stacked on
			// top — leave Esc to that surface.
			if (rootRef.current?.closest("[inert]")) return;
			handleCloseIconClick();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [showCloseIcon, sendEventOnCloseIconClick]);

	// Focus trap. A keydown-based trap (Modal) cannot see Tab presses inside
	// the cross-origin frame, so the dialog is bracketed by two focus guards
	// instead: tabbing out of the frame lands on a guard, which sends focus
	// back to the opposite edge of the dialog. Arriving at a guard from
	// outside the dialog (e.g. Tab from the host page) enters at the nearest
	// edge instead of wrapping. `relatedTarget` is null when focus comes from
	// the frame's document, which is the wrap case.
	const handleFocusGuard = (edge: "start" | "end") => (event: React.FocusEvent) => {
		const root = rootRef.current;
		if (!root) return;
		const focusable = getKeyboardFocusableElements(root).focusable.filter(
			el => !el.hasAttribute(FOCUS_GUARD_ATTRIBUTE),
		) as HTMLElement[];
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const relatedTarget = event.relatedTarget as Node | null;
		const cameFromInside = !relatedTarget || root.contains(relatedTarget);
		const target =
			edge === "start" ? (cameFromInside ? last : first) : cameFromInside ? first : last;
		target?.focus();
	};

	const showHeader = screenTitle || showCloseIcon;

	return (
		<Root
			ref={rootRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby={screenTitle ? TITLE_ID : undefined}
			aria-label={screenTitle ? undefined : fallbackName}
			className="webchat-xapp-overlay-root"
			data-xapp-overlay
		>
			<FocusGuard
				tabIndex={0}
				onFocus={handleFocusGuard("start")}
				{...{ [FOCUS_GUARD_ATTRIBUTE]: "start" }}
			/>
			{showHeader && (
				<Header
					title={screenTitle}
					titleId={TITLE_ID}
					hideBackButton
					onClose={showCloseIcon ? handleCloseIconClick : undefined}
					closeButtonAriaLabel={closeButtonAriaLabel}
					closeButtonRef={closeButtonRef}
				/>
			)}
			<Iframe
				ref={iframeRef}
				src={url}
				title={screenTitle || fallbackName}
				allow="
  accelerometer; ambient-light-sensor; autoplay; battery; bluetooth; camera;
  cross-origin-isolated; display-capture; document-domain; encrypted-media;
  execution-while-not-rendered; execution-while-out-of-viewport;
  fullscreen; gamepad; geolocation; gyroscope; hid; idle-detection;
  interest-cohort; local-fonts; magnetometer; microphone; midi;
  otp-credentials; payment; picture-in-picture; publickey-credentials-get;
  screen-wake-lock; serial; speaker-selection; usb; web-share;
  xr-spatial-tracking"
			/>
			<FocusGuard
				tabIndex={0}
				onFocus={handleFocusGuard("end")}
				{...{ [FOCUS_GUARD_ATTRIBUTE]: "end" }}
			/>
		</Root>
	);
};

export default xAppOverlay;
