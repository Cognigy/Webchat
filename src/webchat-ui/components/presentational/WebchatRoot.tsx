import styled from "@emotion/styled";
import ResetCSS from "./ResetCSS";

interface Props {
	chatWindowWidth?: number;
}

export default styled(ResetCSS)<Props>(({ theme, chatWindowWidth }) => {
	// Fallback if chatWindowWidth is not provided
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
