import React, { FC } from "react";
import { useTheme } from "@emotion/react";
import toast, { ToastOptions, Toaster } from "react-hot-toast";

const Notifications: FC = () => {
	const theme = useTheme();

	return (
		<Toaster
			gutter={1}
			toastOptions={{
				duration: 1500,
				// Failures stay up much longer than confirmations: the user has
				// to read a remedy and act on it, not just register that
				// something worked. The longest of these ("Microphone access
				// is blocked. Allow it in your browser settings…") is ~95
				// characters, which needs well over 5s to notice and read
				// (SC 2.2.1).
				// red40 on red10 is 5.27:1, mirroring the vetted green pairing
				// below (SC 1.4.3).
				error: {
					duration: 12000,
					style: {
						backgroundColor: theme.red10,
						color: theme.red40,
					},
					iconTheme: {
						primary: theme.red40,
						secondary: theme.red10,
					},
				},
				style: {
					backgroundColor: theme.green10,
					borderRadius: 0,
					boxShadow: "none",
					color: theme.green,
					fontFamily: theme.fontFamily,
					fontSize: 14,
					fontWeight: 600,
					lineHeight: 1.3,
					maxWidth: "unset",
					paddingBlock: 16,
					paddingInlineStart: 20,
					width: "100%",
				},
			}}
			containerStyle={{
				left: 0,
				position: "relative",
				right: 0,
				top: 0,
				width: "100%",
			}}
		></Toaster>
	);
};

// The toast node is inserted into the DOM at the moment it appears, so its
// default role="status" never fires in screen readers (WCAG 4.1.3).
// Announcements go through <StatusLiveRegion> (StatusLiveRegion.tsx), which
// is mounted for the lifetime of the open chat window; aria-live="off"
// prevents double announcements. This must be set per toast() call —
// react-hot-toast stamps default ariaProps onto every toast, which override
// any Toaster-level toastOptions.ariaProps.
const silencedAriaProps: ToastOptions["ariaProps"] = {
	role: "status",
	"aria-live": "off",
};

// `message` is intentionally narrowed to string (react-hot-toast also accepts
// JSX): <StatusLiveRegion> mirrors the message as text, so a non-string toast
// would render visibly but never be announced (WCAG 4.1.3).
// className/ariaProps sit after the options spread on purpose — the class is
// the selector the a11y specs rely on, and caller-supplied ariaProps would
// re-enable the double announcement (CGY-34519).
export function createNotification(message: string, options: ToastOptions = {}) {
	toast(message, {
		...options,
		className: "webchat-toast-notification",
		ariaProps: silencedAriaProps,
	});
}

/**
 * Same as `createNotification`, styled as a failure and shown for longer.
 * Use for anything the user needs to act on (e.g. a dictation that could not
 * be started) — the message is mirrored into <StatusLiveRegion> like every
 * other toast, so it reaches screen readers too (SC 3.3.1 / 4.1.3).
 */
export function createErrorNotification(message: string, options: ToastOptions = {}) {
	toast.error(message, {
		...options,
		className: "webchat-toast-notification webchat-toast-notification-error",
		ariaProps: silencedAriaProps,
	});
}

/**
 * Creates a persistent notification.
 * Can be dismissed by calling the returned function.
 *
 * usage example:
 *
 * const dismiss = createPersistentNotification("Hello World!");
 * setTimeout(dismiss, 5000);
 */
export function createPersistentNotification(message: string, options: ToastOptions = {}) {
	const id = toast(message, {
		...options,
		className: "webchat-toast-notification",
		ariaProps: silencedAriaProps,
		duration: Infinity,
	});

	return () => toast.dismiss(id);
}

export default Notifications;
