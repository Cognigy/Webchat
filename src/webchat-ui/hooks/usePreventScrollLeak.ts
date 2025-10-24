import { useEffect } from 'react';

type PreventScrollOptions = {
    element?: HTMLElement | null;
    buttonSelector?: string;
    dependencies?: any[];
};

const usePreventScrollLeak = (props: PreventScrollOptions) => {
    const { element = null, buttonSelector = '', dependencies = [] } = props;

    useEffect(() => {
        const handlePrevent = (event: Event) => {
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

            event.stopPropagation();
            event.preventDefault();
        };

        // For root element scroll prevention
        if (element) {
            element.addEventListener("wheel", handlePreventScroll, { passive: false });
            element.addEventListener("touchmove", handlePreventScroll, { passive: false });
        }

        // For button scroll prevention
        if (buttonSelector) {
            const button = document.querySelector(buttonSelector);
            if (button) {
                button.addEventListener('wheel', handlePrevent, { passive: false });
                button.addEventListener('touchmove', handlePrevent, { passive: false });
            }
        }

        return () => {
            if (element) {
                element.removeEventListener("wheel", handlePreventScroll);
                element.removeEventListener("touchmove", handlePreventScroll);
            }

            if (buttonSelector) {
                const button = document.querySelector(buttonSelector);
                if (button) {
                    button.removeEventListener('wheel', handlePrevent);
                    button.removeEventListener('touchmove', handlePrevent);
                }
            }
        };
    }, dependencies);
};

export default usePreventScrollLeak;