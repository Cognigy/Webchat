import React, { forwardRef, MutableRefObject, useEffect } from "react";
import styled from "@emotion/styled";

interface IWebchatRootProps extends React.HTMLAttributes<HTMLDivElement> {
	chatWindowWidth?: number;
}

const StyledWebchatRoot = styled.div<{ chatWindowWidth?: number }>(
	({ theme, chatWindowWidth }) => {
		const finalWidth = chatWindowWidth ?? 460;

		return {
			display: "flex",
			flexDirection: "column",
			backgroundColor: theme.backgroundWebchat,
			overflow: "hidden",
			fontSize: 16,
			fontFamily: theme.fontFamily,
			overscrollBehavior: "contain",

			"@media screen and (min-width: 576px)": {
				width: finalWidth,
			},

			/**
			 * If the user’s screen is between 576px and "finalWidth" (for example: a 650px screen
			 *  with a 700px chatWindowWidth), we want to shrink. We add 40px to the finalWidth due to the padding.
			 */
			[`@media screen and (min-width: 576px) and (max-width: ${finalWidth + 40}px)`]: {
				width: "90%",
				right: "5%",
			},
		};
	}
);

const WebchatRoot = forwardRef<HTMLDivElement, IWebchatRootProps>((props, ref) => {
	const handlePreventScroll = (event: WheelEvent | TouchEvent) => {
		const target = event.target as HTMLElement;
		if (!target) return;

		const isScrollable = (el: HTMLElement): boolean => {
			const hasScrollableContent = el.scrollHeight > el.clientHeight;
			const isOverflowAuto = getComputedStyle(el).overflowY === "auto";
			return hasScrollableContent && isOverflowAuto;
		};

		let element: HTMLElement | null = target;

		while (element && element !== document.body) {
			if (isScrollable(element)) return;
			element = element.parentElement;
		}

		event.stopPropagation();
		event.preventDefault();
	};

	useEffect(() => {
		const element = (ref as MutableRefObject<HTMLDivElement | null>)?.current;
		if (!element) return;

		element.addEventListener("wheel", handlePreventScroll, { passive: false });
		element.addEventListener("touchmove", handlePreventScroll, { passive: false });

		return () => {
			element.removeEventListener("wheel", handlePreventScroll);
			element.removeEventListener("touchmove", handlePreventScroll);
		};
	}, [ref]);

	return <StyledWebchatRoot ref={ref} {...props} />;
});

export default WebchatRoot;
