/**
 * Forces focus on a specified element and prevents focus from being applied to any other element.
 * This function applies focus to the target element and sets up event listeners to maintain that focus.
 * @param targetElement - The HTML element that should maintain focus
 */
export function forceFocus(targetElement: HTMLElement) {
	const preventFocusChange = e => {
		e.preventDefault();
		targetElement.focus();
	};
	const timer = setTimeout(() => {
		targetElement.focus();
		// Listen for any focus changes immediately after
		document.addEventListener("focusin", preventFocusChange);
	}, 0);
	return () => {
		document.removeEventListener("focusin", preventFocusChange);
		clearTimeout(timer);
	};
}
