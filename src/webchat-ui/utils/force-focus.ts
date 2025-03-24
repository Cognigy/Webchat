/**
 * Forces focus on a specified element and prevents focus from being applied to any other element.
 * This function applies focus to the target element and sets up event listeners to maintain that focus.
 * @param targetElement - The HTML element that should maintain focus
 */
export function forceFocus(targetElement: HTMLElement) {
	// Initially focus the element

	// Function to handle any focus event in the document
	setTimeout(() => {
		targetElement.focus();

		const preventFocusChange = e => {
			e.preventDefault();
			targetElement.focus();
			document.removeEventListener("focusin", preventFocusChange);
		};

		// Listen for any focus changes immediately after
		document.addEventListener("focusin", preventFocusChange);
	}, 10);
}
