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

	// Filter out elements that are not keyboard-reachable: disabled, hidden from
	// the accessibility tree (aria-hidden="true" on the element or an ancestor),
	// or inside an inert subtree — e.g. a leaving screen during its exit
	// transition (see RegularLayoutContentWrapper in WebchatUI.tsx). Matching
	// aria-hidden="true" explicitly (not attribute presence) keeps elements with
	// aria-hidden="false" focusable.
	const focusable = interactiveElsArray?.filter(
		el => !el.hasAttribute("disabled") && !el.closest('[aria-hidden="true"], [inert]'),
	);

	const firstFocusable = focusable && (focusable[0] as HTMLElement);
	const lastFocusable = focusable && (focusable[focusable.length - 1] as HTMLElement);

	return { firstFocusable, lastFocusable, focusable };
};

export default getKeyboardFocusableElements;
