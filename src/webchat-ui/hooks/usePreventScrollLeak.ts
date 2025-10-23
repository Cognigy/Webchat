import { useCallback } from 'react';

export const usePreventScrollLeak = () => {
    return useCallback((element: HTMLElement | null) => {
        if (!element) return;

        const handlePreventScroll = (event: Event) => {
            const target = event.target as HTMLElement;
            if (!target) return;

            const isScrollable = (el: HTMLElement): boolean => {
                const hasScrollableContent = el.scrollHeight > el.clientHeight;
                const isOverflowAuto = getComputedStyle(el).overflowY === "auto";
                return hasScrollableContent && isOverflowAuto;
            };

            let currentElement: HTMLElement | null = target;

            while (currentElement && currentElement !== document.body) {
                if (isScrollable(currentElement)) return;
                currentElement = currentElement.parentElement;
            }

            event.stopPropagation();
            event.preventDefault();
        };

        element.addEventListener("wheel", handlePreventScroll, { passive: false });
        element.addEventListener("touchmove", handlePreventScroll, { passive: false });

        return () => {
            element.removeEventListener("wheel", handlePreventScroll);
            element.removeEventListener("touchmove", handlePreventScroll);
        };
    }, []);
};
