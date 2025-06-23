import { useEffect, useRef, useState } from "react";

const useIsAtBottom = (ref: React.RefObject<HTMLDivElement>) => {
	const [isAtBottom, setIsAtBottom] = useState(true);
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);
	const threshold = 20; // pixels from the bottom to consider "at bottom"
	const debounceMs = 150; // milliseconds for debouncing scroll events

	useEffect(() => {
		const check = () => {
			if (!ref.current) return;
			const { scrollTop, scrollHeight, clientHeight } = ref.current;
			setIsAtBottom(scrollHeight - scrollTop - clientHeight <= threshold);
		};

		const handleScrollOrChange = () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			debounceTimer.current = setTimeout(check, debounceMs);
		};

		const container = ref.current;
		if (container) {
			container.addEventListener("scroll", handleScrollOrChange);
		}

		const resizeObserver = new window.ResizeObserver(handleScrollOrChange);
		if (container) resizeObserver.observe(container);

		const mutationObserver = new window.MutationObserver(handleScrollOrChange);
		if (container) mutationObserver.observe(container, { childList: true, subtree: true });

		// Check if the container is at the bottom and set the state accordingly
		check();

		return () => {
			if (container) {
				container.removeEventListener("scroll", handleScrollOrChange);
				resizeObserver.disconnect();
				mutationObserver.disconnect();
			}
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [ref]);

	return isAtBottom;
};

export default useIsAtBottom;
