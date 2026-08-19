/**
 * Gets keyboard-focusable elements within a given element
 * @param {HTMLElement} element
 * @returns {Array}
 */
const getKeyboardFocusableElements = (element: HTMLElement) => {
	// Get all interactive elements in given element
	const interactiveEls = element?.querySelectorAll(
		'a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])',
	);
	const interactiveElsArray = interactiveEls && Array.from(interactiveEls);

	// Filter out interactive elements that are disabled, aria-hidden, or inside
	// an inert subtree (e.g. the chat layout behind the disconnect overlay, or
	// a leaving screen during its exit transition — see
	// RegularLayoutContentWrapper in WebchatUI.tsx) — those cannot receive
	// focus. Matching aria-hidden="true" explicitly (not attribute presence)
	// keeps elements with aria-hidden="false" focusable. Ancestor aria-hidden
	// is deliberately NOT filtered — hidden surfaces that must be excluded
	// from focus logic carry `inert` alongside aria-hidden (HomeScreen,
	// RegularLayoutContentWrapper, DisconnectableContentWrapper).
	const focusableIgnoringInert = interactiveElsArray?.filter(
		el => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
	);

	const focusable = focusableIgnoringInert?.filter(el => !el.closest("[inert]"));

	const firstFocusable = focusable && (focusable[0] as HTMLElement);
	const lastFocusable = focusable && (focusable[focusable.length - 1] as HTMLElement);

	// focusableIgnoringInert keeps elements inside [inert] subtrees — needed by
	// HomeScreen's tabindex-toggle fallback, which must reach the interactive
	// elements of its own inert-hidden root in browsers without inert support.
	return { firstFocusable, lastFocusable, focusable, focusableIgnoringInert };
};

export default getKeyboardFocusableElements;
