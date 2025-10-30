import styled from "@emotion/styled";
import IconButton from "./IconButton";

const FABDisabled = styled(IconButton)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	width: 56,
	height: 56,
	backgroundColor: theme.greyColor,
	backgroundImage: theme.greyColor,
	color: theme.greyContrastColor,
	fill: theme.greyContrastColor,
	overflow: "visible",
	boxShadow: theme.shadow,
	borderRadius: "50%",
	marginTop: theme.unitSize * 2,

	"&.active, &:hover": {
		color: `${theme.greyContrastColor} !important`,
		fill: `${theme.greyContrastColor} !important`,
	},
}));

export default FABDisabled;
