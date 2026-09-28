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

// Derive the canonical http(s) origin from an xApp URL, or null if the URL is
// unparseable or uses a non-http(s) scheme. data:/about:/blob: URLs produce the
// string "null" from new URL().origin — accepting them would let bot-supplied
// data: xApps forge postMessages accepted by the handleSubmit origin check.
const getXAppOrigin = (url: string): string | null => {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
		return parsed.origin;
	} catch {
		return null;
	}
};

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
	// A whitespace-only screen title has no accessible text: it would render
	// an empty heading and name the dialog after it. Treat it as absent.
	const title = screenTitle?.trim() ?? "";
	// Names the dialog and its frame when the xApp has no screen title.
	const fallbackName = ariaLabels?.xAppOverlay ?? "Embedded app";
	const closeButtonAriaLabel = ariaLabels?.closeDialog ?? "Close dialog";

	const dispatch = useDispatch();
	const rootRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	const xAppOrigin = getXAppOrigin(url);

	// For invalid or non-http(s) URLs close the overlay immediately so Redux
	// state is cleaned up and the widget does not dead-end. Dispatch must happen
	// in an effect — not during render — to satisfy React's rules.
	useEffect(() => {
		if (url && xAppOrigin === null) {
			console.error("[xApp] Invalid xApp URL — must be an absolute http(s) URL:", url);
			dispatch(closeOverlay());
		}
	}, [url, xAppOrigin]);

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
		// Reuse xAppOrigin from render scope (includes the http(s)-only scheme guard
		// from getXAppOrigin). This prevents opaque-origin ("null") postMessages from
		// data:/about:/blob: URLs — which stay in Redux until the cleanup effect fires —
		// from matching via event.origin === "null" between render and effect execution.
		//
		// NOTE — known limitation: cross-origin xApps receive allow-same-origin in the
		// sandbox so their postMessages carry the real origin and this check is sound.
		// However, a cross-origin xApp document could navigate itself to the embedding
		// origin and then use frameElement to remove the sandbox (the allow-top-navigation
		// restriction covers top-level navigation only, not self-navigation). A proper fix
		// requires a token-based handshake or CSP headers on the xApp host to prevent
		// cross-origin-to-same-origin navigation; tracked as a follow-up hardening.
		//
		// Same-origin xApps omit allow-same-origin so they run with an opaque origin;
		// their postMessages arrive with event.origin === "null" and are rejected here.
		// Accepting opaque-origin messages via event.source (WindowProxy) is also unsafe:
		// a navigated iframe retains the same WindowProxy, so an attacker document loaded
		// via navigation passes both checks. Same-origin xApp x-app-submit therefore
		// requires the xApp to be hosted at a cross-origin URL.
		if (xAppOrigin === null || xAppOrigin !== event.origin) {
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

	// WCH-SI10-003: allow-scripts + allow-same-origin together let a same-origin
	// iframe remove its own sandbox via frameElement. Omitting allow-same-origin
	// for same-origin xApp URLs prevents that escape; the trade-off is that
	// same-origin xApp iframes run with an opaque origin, so their postMessage
	// x-app-submit events are rejected (event.origin === "null"). Tenants whose
	// xApps are hosted on the same domain as the embedding page must move them to
	// a cross-origin host to use the submit flow.
	// Cross-origin URLs include allow-same-origin so the frame can access its own
	// host's resources (cookies, localStorage) and postMessages carry the real origin.
	const isSameOrigin = xAppOrigin !== null && xAppOrigin === window.location.origin;
	const sandboxValue = [
		"allow-scripts",
		// Only include allow-same-origin when the URL is a valid, cross-origin http(s)
		// URL. When xAppOrigin is null the iframe is still rendered briefly before the
		// cleanup effect closes it — don't grant allow-same-origin during that window.
		...(xAppOrigin !== null && !isSameOrigin ? ["allow-same-origin"] : []),
		"allow-forms",
		"allow-popups",
		// Popups must not inherit the creator's sandbox flags — OAuth, SSO, and
		// payment-provider windows run under constraints they were never tested against.
		"allow-popups-to-escape-sandbox",
		"allow-modals",
		// Boarding-pass (.pkpass), signature, PDF, and other download-generating xApps.
		"allow-downloads",
		// Redirect-based payment flows (3DS, iDEAL, Bancontact) and SSO return URLs.
		"allow-top-navigation-by-user-activation",
		// Storage Access API in a third-party frame context (Safari ITP, Chrome 3P-cookie rules).
		"allow-storage-access-by-user-activation",
	].join(" ");

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

	const showHeader = title || showCloseIcon;

	return (
		<Root
			ref={rootRef}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? TITLE_ID : undefined}
			aria-label={title ? undefined : fallbackName}
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
					title={title}
					titleId={TITLE_ID}
					hideBackButton
					onClose={showCloseIcon ? handleCloseIconClick : undefined}
					closeButtonAriaLabel={closeButtonAriaLabel}
					closeButtonRef={closeButtonRef}
				/>
			)}
			<Iframe
				ref={iframeRef}
				src={xAppOrigin === null ? undefined : url}
				title={title || fallbackName}
				sandbox={sandboxValue}
				allow="autoplay; camera; display-capture; encrypted-media; fullscreen; geolocation; microphone; picture-in-picture; web-share; payment; publickey-credentials-get; otp-credentials; accelerometer; gyroscope; magnetometer; screen-wake-lock; speaker-selection"
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
