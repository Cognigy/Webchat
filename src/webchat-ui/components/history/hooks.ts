import { useEffect, useRef, useState } from "react";

const useIsAtBottom = (ref: React.RefObject<HTMLDivElement>) => {
	const [isAtBottom, setIsAtBottom] = useState(true);
	const [userScrolledUp, setUserScrolledUp] = useState(false);
	const lastScrollTop = useRef(0);
	const threshold = 20;
	const debounceMs = 150;
	const debounceTimer = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		const check = () => {
			if (!ref.current) return;
			const { scrollTop, scrollHeight, clientHeight } = ref.current;
			const atBottom = scrollHeight - scrollTop - clientHeight <= threshold;

			setIsAtBottom(atBottom);
			if (atBottom) {
				setUserScrolledUp(false); // reset when back at bottom
			}
		};

		const handleScroll = () => {
			if (!ref.current) return;
			const scrollTop = ref.current.scrollTop;

			if (scrollTop < lastScrollTop.current) {
				setUserScrolledUp(true);
			}
			lastScrollTop.current = scrollTop;

			if (debounceTimer.current) clearTimeout(debounceTimer.current);
			debounceTimer.current = setTimeout(check, debounceMs);
		};

		const container = ref.current;
		if (!container) return;

		container.addEventListener("scroll", handleScroll);
		const resizeObserver = new ResizeObserver(handleScroll);
		const mutationObserver = new MutationObserver(handleScroll);

		resizeObserver.observe(container);
		mutationObserver.observe(container, { childList: true, subtree: true });

		check();

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
