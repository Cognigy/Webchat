import React, { FC, memo } from "react";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import { IWebchatSettings } from "../../../common/interfaces/webchat-config";
import { useSelector } from "../../../webchat/helper/useSelector";
import { getAccessiblePrimaryVariant } from "../../style";

const Link = styled.a(({ theme }) => ({
	display: "flex",
	alignItems: "baseline",
	alignSelf: "center",
	width: "fit-content",
	height: 12,

	color: theme.textDark,

	textDecoration: "none",

	"&:focus, &:hover": {
		outline: "none",
		color: getAccessiblePrimaryVariant(theme.primaryColor, theme.white),
	},

	"&:focus-visible": {
		outline: `2px solid ${getAccessiblePrimaryVariant(theme.primaryColor, theme.white)}`,
		outlineOffset: 2,
	},
}));

const Placeholder = styled.div(() => ({}));

const URL = `https://www.cognigy.com/?utm_campaign=CognigyWebchatEmbedded&utm_medium=webchat&utm_term=webchat&utm_content=webchat&utm_source=${window.location.hostname}`;

interface IBrandingProps {
	id?: string;
	watermark?: IWebchatSettings["layout"]["watermark"];
	watermarkText?: string;
	watermarkUrl?: string;
}

const Branding: FC<IBrandingProps> = props => {
	const { id, watermark, watermarkText, watermarkUrl } = props;
	const ariaLabels = useSelector(state => state.config.settings.customTranslations?.ariaLabels);
	if (watermark === "none") return <Placeholder />;

	return (
		<Link
			href={watermarkUrl || URL}
			target="_blank"
			aria-label={`${watermarkText}. ${ariaLabels?.opensInNewTab ?? "Opens in new tab"}`}
			id={id ?? "cognigyBrandingLink"}
		>
			<Typography
				variant="copy-medium"
				component="span"
				fontSize="0.625rem"
				lineHeight="120%"
			>
				{watermark === "custom" && watermarkText ? watermarkText : "Powered by Cognigy.AI"}
			</Typography>
		</Link>
	);
};

export default memo(Branding, () => true);
