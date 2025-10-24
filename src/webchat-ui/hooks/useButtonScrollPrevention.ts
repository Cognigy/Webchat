import { useEffect } from 'react';

export const useButtonScrollPrevention = (buttonSelector: string, dependencies: any[] = []) => {
    useEffect(() => {
        const button = document.querySelector(buttonSelector);
        if (!button) return;

        const handlePrevent = (event: Event) => {
            event.stopPropagation();
            event.preventDefault();
        };

        button.addEventListener('wheel', handlePrevent, { passive: false });
        button.addEventListener('touchmove', handlePrevent, { passive: false });

        return () => {
            const button = document.querySelector(buttonSelector);
            if (button) {
                button.removeEventListener('wheel', handlePrevent);
                button.removeEventListener('touchmove', handlePrevent);
            }
        };
    }, dependencies);
};
