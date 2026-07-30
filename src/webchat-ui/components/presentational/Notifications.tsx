import React, { FC, useEffect, useRef, useState } from "react";
import { useTheme } from "@emotion/react";
import toast, { ToastOptions, Toaster, useToasterStore } from "react-hot-toast";

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

interface LiveNotification {
	id: string;
	text: string;
}

/**
 * Always-mounted screen-reader live region mirroring toast notifications.
 *
 * react-hot-toast adds the toast (and its role="status" wrapper) to the DOM
 * only when the notification fires, which live-region processing ignores.
 * This region exists in the DOM before any toast is created, so updating its
 * text content triggers a proper announcement (WCAG 4.1.3 Status Messages).
 */
export const NotificationsLiveRegion: FC = () => {
	const { toasts } = useToasterStore();
	const announcedIdsRef = useRef<Set<string>>(new Set());
	const [liveNotification, setLiveNotification] = useState<LiveNotification | null>(null);

	useEffect(() => {
		const unannounced = toasts.filter(
			t => t.visible && !announcedIdsRef.current.has(t.id) && typeof t.message === "string",
		);
		if (!unannounced.length) return;

		unannounced.forEach(t => announcedIdsRef.current.add(t.id));

		// Announce the most recent notification; toasts virtually never
		// stack within a single render in Webchat.
		const latest = unannounced[unannounced.length - 1];
		setLiveNotification({ id: latest.id, text: latest.message as string });
	}, [toasts]);

	return (
		<div
			role="status"
			aria-live="polite"
			aria-atomic="true"
			id="webchatNotificationsLiveRegion"
			className="sr-only"
		>
			{liveNotification && <div key={liveNotification.id}>{liveNotification.text}</div>}
		</div>
	);
};

type MessageType = Parameters<typeof toast>[0];

// The toast node is inserted into the DOM at the moment it appears, so its
// default role="status" never fires in screen readers (WCAG 4.1.3).
// Announcements go through <NotificationsLiveRegion>, which is always
// mounted; aria-live="off" prevents double announcements. This must be set
// per toast() call — react-hot-toast stamps default ariaProps onto every
// toast, which override any Toaster-level toastOptions.ariaProps.
const silencedAriaProps: ToastOptions["ariaProps"] = {
	role: "status",
	"aria-live": "off",
};

export function createNotification(message: MessageType, options: ToastOptions = {}) {
	toast(message, { ariaProps: silencedAriaProps, ...options });
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
export function createPersistentNotification(message: MessageType, options: ToastOptions = {}) {
	const id = toast(message, { ariaProps: silencedAriaProps, ...options, duration: Infinity });

	return () => toast.dismiss(id);
}

export default Notifications;
