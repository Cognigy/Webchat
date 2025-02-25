import styled from "@emotion/styled";
import { IColorProps } from "../../style";
import { createTransition } from "../../utils/css";
export interface IIconButtonProps extends IColorProps {
	selected?: boolean;
}

export default styled.button<IIconButtonProps>(({ theme }) => {
	const normal = "hsla(0, 0%, 0%, .24)";
	const highlight = "hsla(0, 0%, 0%, .54)";

	return {
		// ...interactionCss,

		padding: theme.unitSize,
		boxSizing: "border-box",
		color: normal,
		fill: normal,
		backgroundColor: "transparent",
		border: "none",
		outline: "none",
		margin: 0,

		"&:not(.disabled)": {
			cursor: "pointer",

			"&.active, &:hover": {
				color: highlight,
				fill: highlight,
			},
		},

		transition: createTransition("background-color", "color", "fill"),

		svg: {
			width: 22,
			height: 22,
		},
	};
});
