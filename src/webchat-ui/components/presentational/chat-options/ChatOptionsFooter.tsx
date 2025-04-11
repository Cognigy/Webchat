import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import { IWebchatSettings } from "../../../../common/interfaces/webchat-config";

const Footer = styled.div(({ theme }) => ({
	alignItems: " center",
	justifyContent: "center",
	padding: "12px 0px",
	gap: 24,
	width: "100%",
	display: "flex",
	backgroundColor: theme.white,
	borderTop: `1px solid var(--basics-black-80, ${theme.black80})`,
}));

const Link = styled.a(({ theme }) => ({
	textDecoration: "none",
	color: theme.black10,

	"&:focus": {
		outline: "none",
		color: theme.primaryWeakColor,
	},
}));

const StyledFooterTypography = styled(Typography)(() => ({
	lineHeight: "19.6px",
	wordWrap: "break-word",
	margin: 0,
}));

interface IChatOptionsFooterProps {
	settings: IWebchatSettings;
}

export const ChatOptionsFooter = (props: IChatOptionsFooterProps) => {
	const { settings } = props;
	const { chatOptions, customTranslations } = settings;

	const footerItem1Text = chatOptions?.footer?.items?.[0]?.title || "Imprint";
	const footerItem2Text = chatOptions?.footer?.items?.[1]?.title || "Data Privacy";

	const footerItem1URL =
		chatOptions?.footer?.items?.[0]?.url || "https://www.cognigy.com/legal-notice";
	const footerItem2URL =
		chatOptions?.footer?.items?.[1]?.url || "https://www.cognigy.com/privacy-policy";
	const opensInNewTab = customTranslations?.ariaLabels?.opensInNewTab || "Opens in new tab";
	return (
		<Footer className="webchat-chat-options-footer">
			<Link
				href={footerItem1URL}
				target="_blank"
				id="footer-text-1"
				aria-label={`${footerItem1Text}. ${opensInNewTab}`}
				className="webchat-chat-options-footer-link"
			>
				<StyledFooterTypography
					variant="body-semibold"
					className="webchat-chat-options-footer-link-text"
				>
					{footerItem1Text}
				</StyledFooterTypography>
			</Link>
			{chatOptions?.footer?.items?.[1] && (
				<Link
					href={footerItem2URL}
					target="_blank"
					id="footer-text-2"
					aria-label={`${footerItem2Text}. ${opensInNewTab}`}
				>
					<StyledFooterTypography variant="body-semibold">
						{footerItem2Text}
					</StyledFooterTypography>
				</Link>
			)}
		</Footer>
	);
};
