import React, { forwardRef, useState, useEffect } from "react";
import styled from "@emotion/styled";
import usePreventScrollLeak from "../../hooks/usePreventScrollLeak";

interface IWebchatRootProps extends React.HTMLAttributes<HTMLDivElement> {
	chatWindowWidth?: number;
}

const StyledWebchatRoot = styled.div<{ chatWindowWidth?: number }>(({ theme, chatWindowWidth }) => {
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
});

const WebchatRoot = forwardRef<HTMLDivElement, IWebchatRootProps>((props, ref) => {
	const [element, setElement] = useState<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!ref) return;
		setElement((ref as React.MutableRefObject<HTMLDivElement | null>).current);
	}, [ref]);

	usePreventScrollLeak({ element });

	return <StyledWebchatRoot ref={ref} {...props} />;
});

export default WebchatRoot;
