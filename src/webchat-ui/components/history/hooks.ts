import { useEffect, useRef, useState } from "react";

const THRESHOLD = 20; // pixels from the bottom to consider "at bottom"
const DEBOUNCE_MS = 150; // debounce time in milliseconds

const useIsAtBottom = (ref: React.RefObject<HTMLDivElement>) => {
	const [isAtBottom, setIsAtBottom] = useState(true);
	const [userScrolledUp, setUserScrolledUp] = useState(false); // True if user has scrolled up, false if at bottom or returned to bottom

	const lastScrollTop = useRef(0);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const checkIsAtBottom = () => {
			if (!ref.current) return;
			const { scrollTop, scrollHeight, clientHeight } = ref.current;
			const atBottom = scrollHeight - scrollTop - clientHeight <= THRESHOLD;

			setIsAtBottom(atBottom); // Update isAtBottom state
			if (atBottom) {
				setUserScrolledUp(false); // Reset when back at bottom
			}
		};

		const handleScroll = () => {
			if (!ref.current) return;
			const scrollTop = ref.current.scrollTop;
			// If user scrolls up, mark as scrolled up
			if (scrollTop < lastScrollTop.current) {
				setUserScrolledUp(true);
			}
			lastScrollTop.current = scrollTop;

			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			debounceTimer.current = setTimeout(checkIsAtBottom, DEBOUNCE_MS);
		};

		const container = ref.current;
		if (!container) return;

		container.addEventListener("scroll", handleScroll);
		const resizeObserver = new ResizeObserver(handleScroll);
		const mutationObserver = new MutationObserver(handleScroll);

		// Observe the container for size changes and mutations
		resizeObserver.observe(container);
		mutationObserver.observe(container, { childList: true, subtree: true });

		checkIsAtBottom();

		return () => {
			container.removeEventListener("scroll", handleScroll);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [ref]);

	return { isAtBottom, userScrolledUp };
};

export default useIsAtBottom;
