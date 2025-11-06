// Stores the original overflow value of the body so it can be restored later
let originalBodyOverflow: string | null = null;

//Returns true if the viewport width is 575px or less (mobile).
const isMobileViewport = (): boolean => {
	return typeof window !== "undefined" && window.innerWidth <= 575;
}

// Locks body scroll by setting overflow: hidden. Remembers the original overflow value to restore later.
const lockBodyScroll = () => {
	if (typeof document === "undefined") return;
	const body = document.body;
	if (!body) return;
	if (originalBodyOverflow === null) {
		originalBodyOverflow = body.style.overflow || "";
	}
	body.style.overflow = "hidden";
}


// Restores the body's original overflow value if it was changed.
const restoreBodyOverflow = () => {
	if (typeof document === "undefined") return;
	const body = document.body;
	if (!body) return;
	if (originalBodyOverflow !== null) {
		body.style.overflow = originalBodyOverflow;
		originalBodyOverflow = null;
	}
}

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
}
