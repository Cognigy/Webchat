import { lock, unlock, clearBodyLocks } from "tua-body-scroll-lock";

let originalBodyOverflow: string | null = null;

// Returns true if the viewport width is 575px or less (mobile).
const isMobileViewport = (): boolean => {
	return typeof window !== "undefined" && window.innerWidth <= 575;
};

// Locks body scroll. Keeps webchat scrollable.
const lockBodyScroll = () => {
	if (typeof document === "undefined") return;

	const body = document.body;
	const html = document.documentElement;

	if (!body) return;

	// Save original overflow
	if (originalBodyOverflow === null) {
		originalBodyOverflow = body.style.overflow || "";
	}

	body.style.overflow = "hidden";
	html.style.overflow = "hidden";

	// Apply body overflow hidden on resize
	visualViewport?.addEventListener("resize", () => {
		body.style.overflow = "hidden";
		html.style.overflow = "hidden";
	});

	const webchatRoot = document.getElementById("webchatChatHistory") as HTMLElement | null;
	const persistentMenu = document.querySelector(".webchat-input-persistent-menu") as HTMLElement | null;
	const textArea = document.getElementById("webchatInputMessageInputInTextMode") as HTMLElement | null;
	const ratingInput = document.getElementById("webchatRatingInput") as HTMLElement | null;
	const privacyNotice = document.querySelector(".webchat-privacy-notice-root") as HTMLElement | null;
	const chatOptions = document.querySelector(".webchat-chat-options-container") as HTMLElement | null;
	const conversationsList = document.querySelector(".webchat-prev-conversations-content") as HTMLElement | null;

	const targetEls = [webchatRoot, persistentMenu, textArea, ratingInput, privacyNotice, chatOptions, conversationsList] as HTMLElement[];

	if (targetEls) {
		lock(targetEls, {
			setOverflowForIOS: true,
			overflowType: "clip",
		});
	} else {
		lock();
	}
};


// Restores the body's original overflow value if it was changed.
const restoreBodyOverflow = () => {
	if (typeof document === "undefined") return;

	const body = document.body;
	const html = document.documentElement;

	if (!body) return;

	// Restore overflow
	if (originalBodyOverflow !== null) {
		body.style.overflow = originalBodyOverflow;
		originalBodyOverflow = null;
	}

	unlock();
	clearBodyLocks();
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
