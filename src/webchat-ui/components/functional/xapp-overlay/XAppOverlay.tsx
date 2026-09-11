import { useDispatch } from "react-redux";
import React, { FC, useEffect } from "react";
import styled from "@emotion/styled";

import { addMessage } from "../../../../webchat/store/messages/message-reducer";
import { closeOverlay } from "../../../../webchat/store/xapp-overlay/slice";
import { useOverlaySettingsByUrl } from "../../../../webchat/store/xapp-overlay/hooks";
import { useSelector } from "../../../../webchat/helper/useSelector";
import Header from "../../presentational/Header";
import { sendMessage } from "../../../../webchat/store/messages/message-middleware";

const Root = styled.div(() => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	width: "100%",
	animation: "fade-in-xapp .25s ease-out",
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

const xAppOverlay: FC = () => {
	const url = useSelector(state => state.xAppOverlay.currentUrl) || "";
	const {
		closeOnSubmit,
		feedbackMessage,
		screenTitle,
		sendEventOnCloseIconClick,
		showCloseIcon,
	} = useOverlaySettingsByUrl(url);

	const dispatch = useDispatch();

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

	if (xAppOrigin === null) {
		return null;
	}

	// WCH-SI10-003: allow-scripts + allow-same-origin together let a same-origin
	// iframe remove its own sandbox via frameElement. Omitting allow-same-origin
	// for same-origin URLs blocks that escape while still rendering the xApp.
	// Cross-origin URLs include it so the frame can access same-origin resources
	// on its own host (cookies, localStorage, etc.).
	const isSameOrigin = xAppOrigin === window.location.origin;
	const sandboxValue = [
		"allow-scripts",
		...(isSameOrigin ? [] : ["allow-same-origin"]),
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

	const showHeader = screenTitle || showCloseIcon;

	return (
		<Root tabIndex={0} role="dialog" aria-modal="true" aria-label={screenTitle || "xApp"}>
			{showHeader && (
				<Header
					title={screenTitle}
					hideBackButton
					onClose={showCloseIcon ? handleCloseIconClick : undefined}
				/>
			)}
			<Iframe
				src={url}
				title={screenTitle || "xApp"}
				sandbox={sandboxValue}
				allow="autoplay; camera; display-capture; encrypted-media; fullscreen; geolocation; microphone; picture-in-picture; web-share; payment; publickey-credentials-get; otp-credentials; accelerometer; gyroscope; magnetometer; screen-wake-lock; speaker-selection"
			/>
		</Root>
	);
};

export default xAppOverlay;
