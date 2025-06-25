import styled from "@emotion/styled";
import { IColorProps } from "../../style";
import { interactionCss, createTransition } from "../../utils/css";

export default styled.button<IColorProps>(({ color, theme }) => {
	const colors = {
		weak: theme.greyWeakColor,
		main: theme.greyColor,
		strong: theme.greyStrongColor,
		contrast: theme.greyContrastColor,
	};

	if (color === "primary") {
		colors.weak = theme.secondaryColorDisabled;
		colors.main = theme.secondaryColor;
		colors.strong = theme.secondaryColorHover;
		colors.contrast = theme.secondaryContrastColor;
	}

	return {
		...interactionCss,

		borderRadius: 10,
		display: "flex",
		width: "19rem", // 303px
		height: "2.75rem", // 44px
		padding: "0.8rem 0", // 11px top/bottom
		justifyContent: "center",
		alignItems: "center",
		flexShrink: 0,

		backgroundColor: colors.main,
		color: colors.contrast,

		textTransform: "unset",
		fontSize: "0.875rem", // 14px
		fontStyle: "normal",
		fontWeight: 600,
		lineHeight: "160%",

		border: "none",
		outline: "none",

		cursor: "pointer",

		transition: createTransition("background-color"),

		"&:disabled": {
			opacity: 0.4,
			cursor: "default",
			backgroundColor: colors.weak,
		},

		"&:hover:not(:disabled)": {
			backgroundColor: colors.strong,
		},

		"&:active:not(:disabled)": {
			backgroundColor: colors.weak,
		},

		"&:focus-visible": {
			outline: `2px solid ${theme.primaryColor}`,
			outlineOffset: 2,
		},
	};
});
