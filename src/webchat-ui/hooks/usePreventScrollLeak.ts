import { useEffect } from 'react';

type PreventScrollOptions = {
    element: HTMLElement | null;
    isButton?: boolean;
    dependencies?: any[];
};

const usePreventScrollLeak = (props: PreventScrollOptions) => {
    const { element, isButton = false, dependencies = [] } = props;
    
    useEffect(() => {
        if (!element) return;

        const preventScrollLeak = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
        };

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

            preventScrollLeak(event);
        };

        const handler = isButton ? preventScrollLeak : handlePreventScroll;

        element.addEventListener("wheel", handler, { passive: false });
        element.addEventListener("touchmove", handler, { passive: false });

        return () => {
            element.removeEventListener("wheel", handler);
            element.removeEventListener("touchmove", handler);
        };
    }, [element, isButton, ...dependencies]);
};

export default usePreventScrollLeak;