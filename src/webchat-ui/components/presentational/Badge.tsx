import React, { ComponentProps } from "react";
import styled from "@emotion/styled";

const BadgeBase = styled.span(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	flexWrap: "wrap",
	justifyContent: "center",
	alignContent: "center",
	alignItems: "center",
	position: "absolute",
	top: 0,
	right: 0,
	fontSize: (theme.unitSize * 3) / 2,
	lineHeight: 12,
	fontWeight: 700,
	width: theme.unitSize * 2,
	height: theme.unitSize * 2,
	borderRadius: "50%",
	backgroundColor: "rgb(235, 15, 0)",
	color: "white",
	fontFamily: "sans-serif",
}));

interface IBadgeProps extends ComponentProps<typeof BadgeBase> {
	_content: number;
}

const Badge = (props: IBadgeProps) => {
	const { _content, ...badgeBaseProps } = props;

	let content = _content;

	if (content === 0) return null;

	if (content > 99) content = 99;

	return <BadgeBase {...badgeBaseProps}>{content}</BadgeBase>;
};

export default Badge;
