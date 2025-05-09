import React from "react";
import ArrowIcon from "../../assets/arrow-back-16px.svg";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import classNames from "classnames";
import { useSelector } from "../../../webchat/helper/useSelector";

interface LinkProps {
	text: string;
	url: string;
	target?: string;
	icon?: string;
	className?: string;
}

const LinkWrapper = styled.a(({ theme }) => ({
	display: "inline-flex",
	justifyContent: "center",
	alignItems: "center",
	gap: 8,
	color: theme.black10,
	backgroundColor: theme.white,
	width: 303,
	height: 44,
	borderRadius: 10,
	textDecoration: "none",
	svg: {
		transform: "rotate(180deg)",
		fill: theme.black10,
	},

	"& svg:dir(rtl)": {
		transform: "rotate(0deg)",
	},

	"&:disabled": {
		cursor: "default",
		color: theme.black60,
		backgroundColor: theme.white,
		svg: {
			fill: theme.black60,
		},
	},

	"&:hover:not(:disabled)": {
		color: theme.black40,
		backgroundColor: theme.white,
		svg: {
			fill: theme.black40,
		},
	},

	"&:focus:not(:disabled)": {
		color: theme.black40,
		backgroundColor: theme.white,
		svg: {
			fill: theme.black40,
		},
	},

	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},

	"&:active:not(:disabled)": {
		color: theme.black40,
		backgroundColor: theme.white,
		svg: {
			fill: theme.black40,
		},
	},
}));

const Link: React.FC<LinkProps> = props => {
	const { text, url, target, icon, className } = props;

	const ariaLabels = useSelector(state => state.config.settings.customTranslations?.ariaLabels);
	const opensInNewTab = ariaLabels?.opensInNewTab || "Opens in new tab";
	const ariaLabel = target === "_blank" ? `${text}. ${opensInNewTab}` : undefined;

	return (
		<LinkWrapper
			className={classNames("tertiary-button", className)}
			href={url}
			target={target}
			aria-label={ariaLabel}
		>
			<Typography variant="cta-semibold">{text}</Typography>
			{icon || <ArrowIcon />}
		</LinkWrapper>
	);
};

export default Link;
