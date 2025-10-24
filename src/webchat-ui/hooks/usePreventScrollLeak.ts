import { useEffect } from 'react';

type PreventScrollOptions = {
    element?: HTMLElement | null;
    buttonSelector?: string;
    dependencies?: any[];
};

const usePreventScrollLeak = (props: PreventScrollOptions) => {
    const { element = null, buttonSelector = '', dependencies = [] } = props;

    useEffect(() => {
        const button = buttonSelector && document.querySelector(buttonSelector);

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

        const el = element || button;

        if (el) {
            el.addEventListener("wheel", button ? preventScrollLeak : handlePreventScroll, { passive: false });
            el.addEventListener("touchmove", button ? preventScrollLeak : handlePreventScroll, { passive: false });
        }

        return () => {
            if (el) {
                el.removeEventListener("wheel", button ? preventScrollLeak : handlePreventScroll);
                el.removeEventListener("touchmove", button ? preventScrollLeak : handlePreventScroll);
            }
        };
    }, dependencies);
};

export default usePreventScrollLeak;