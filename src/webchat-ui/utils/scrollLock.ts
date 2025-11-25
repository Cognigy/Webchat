import { lock, unlock, clearBodyLocks } from "tua-body-scroll-lock";

let originalBodyOverflow: string | null = null;
let observer: MutationObserver | null = null;

// Returns true if the viewport width is 575px or less.
const isMobileViewport = (): boolean => {
	return typeof window !== "undefined" && window.innerWidth <= 575;
};

// Returns all elements with the data-scrollable attribute.
const getScrollableElements = () => {
	const scrollableElements: HTMLElement[] = Array.from(
		document.querySelectorAll("[data-scrollable]"),
	);
	return scrollableElements;
};

// Locks body scroll. Keeps webchat scrollable.
const lockBodyScroll = () => {
	if (typeof document === "undefined") return;

	const body = document.body;

	if (!body) return;

	// Save original overflow
	if (originalBodyOverflow === null) {
		originalBodyOverflow = body.style.overflow || "";
	}

	body.style.overflow = "hidden";

	const webchatRoot = document.getElementById("webchatChatHistory");
	const persistentMenu = document.querySelector(".webchat-input-persistent-menu");
	const textArea = document.getElementById("webchatInputMessageInputInTextMode");
	const ratingInput = document.getElementById("webchatRatingInput");
	const privacyNotice = document.querySelector(".webchat-privacy-notice-root");
	const chatOptions = document.querySelector(".webchat-chat-options-container");
	const conversationsList = document.querySelector(".webchat-prev-conversations-content");

	const scrollables = getScrollableElements();

	lock(scrollables, {
		setOverflowForIOS: true,
		overflowType: "clip",
	});

	// Attach Mutation Observer
	if (!observer) {
		observer = new MutationObserver(() => {
			const updatedScrollables = getScrollableElements();
			clearBodyLocks();
			lock(updatedScrollables);
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}
};

// Restores the body's original overflow value if it was changed.
const restoreBodyOverflow = () => {
	if (typeof document === "undefined") return;

	const body = document.body;

	if (!body) return;

	// Restore overflow
	if (originalBodyOverflow !== null) {
		body.style.overflow = originalBodyOverflow;
		originalBodyOverflow = null;
	}

	unlock();
	clearBodyLocks();

	if (observer) {
		observer.disconnect();
		observer = null;
	}
};

/**
 * Locks or restores body scroll depending on whether the webchat is open and on mobile.
 * @param open - Whether the webchat is open
 */
export const handleBodyScrollLock = (open: boolean) => {
	if (open && isMobileViewport()) {
		lockBodyScroll();
	} else {
		restoreBodyOverflow();
	}
};
