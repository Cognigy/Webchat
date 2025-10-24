import { DependencyList, useEffect, useMemo } from 'react';

type PreventScrollOptions = {
    element: HTMLElement | null;
    isButton?: boolean;
    dependencies?: DependencyList;
};

const usePreventScrollLeak = (props: PreventScrollOptions) => {
    const { element, isButton = false, dependencies = [] } = props;
    
    const isScrollable = useMemo(() => {
        return (el: HTMLElement): boolean => {
            const hasScrollableContent = el.scrollHeight > el.clientHeight;
            const overflowY = getComputedStyle(el).overflowY;
            const isOverflowAuto = overflowY === "auto" || overflowY === "scroll";
            
            return hasScrollableContent && isOverflowAuto;
        };
    }, []);
    
    useEffect(() => {
        if (!element) return;

        const preventScrollLeak = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
        };

        const handlePreventScroll = (event: Event) => {
            const target = event.target as HTMLElement;
            if (!target) return;

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
    }, [element, isButton, isScrollable, ...dependencies]);
};

export default usePreventScrollLeak;