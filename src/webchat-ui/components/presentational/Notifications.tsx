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
