import styled from "@emotion/styled";
import IconButton from "./IconButton";

const FAB = styled(IconButton)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	width: 50,
	height: 50,
	backgroundColor: theme.primaryColor,
	backgroundImage: theme.primaryGradient,
	color: theme.primaryContrastColor,
	fill: theme.primaryContrastColor,
	overflow: "visible",
	boxShadow: theme.shadow,
	borderRadius: "50%",
	marginTop: theme.unitSize * 2,

	"&.active, &:hover": {
		backgroundImage: theme.primaryStrongGradient,
		fill: `${theme.primaryContrastColor} !important`,
	},

	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
		boxShadow: `0 0 0 4px ${theme.white}`,
	},
}));

export default FAB;
