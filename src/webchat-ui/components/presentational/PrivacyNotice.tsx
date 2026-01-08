import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import PrimaryButton from "./PrimaryButton";
import PolicyLink from "./PrimaryLink";
import { IWebchatSettings } from "../../../common/interfaces/webchat-config";
import Markdown from "react-markdown";
import { sanitizeHTML } from "../../../webchat/helper/sanitize";
import remarkGfm from "remark-gfm";

const PrivacyNoticeRoot = styled.div(({ theme }) => ({
	height: "100%",
	width: "100%",
	backgroundColor: theme.white,
	display: "flex",
	flex: "1 0 0",
	flexDirection: "column",
	justifyContent: "space-between",
	alignItems: "center",
	padding: 20,
	overflowY: "auto",
	overscrollBehavior: "contain",
}));

const PrivacyMessage = styled.div(({ theme }) => ({
	":focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 8,
	},

	".webchat-privacy-notice-markdown-container > p": {
		margin: 0,
		whiteSpace: "pre-wrap",
	},
}));

const PrivacyActions = styled.div({
	display: "flex",
	alignItems: "center",
	flexDirection: "column",
	gap: 16,
});

const AcceptButton = styled(PrimaryButton)(() => ({
	width: 303,
}));

interface IPrivacyNoticeProps {
	privacyNotice: IWebchatSettings["privacyNotice"];
	onAcceptTerms: () => void;
	isHomeScreenEnabled: boolean;
}

export const PrivacyNotice = (props: IPrivacyNoticeProps) => {
	const { privacyNotice, onAcceptTerms, isHomeScreenEnabled } = props;
	const { text, submitButtonText, urlText, url } = privacyNotice;

	const sanitizedText = useMemo(() => sanitizeHTML(text), [text]);

	return (
		<PrivacyNoticeRoot className="webchat-privacy-notice-root">
			<PrivacyMessage className="webchat-privacy-notice-message">
				<Typography variant="body-regular" style={{ whiteSpace: "pre-wrap" }}>
					<Markdown
						components={{
							a: ({ node, ...props }) => (
								<a {...props} target="_blank" rel="noreferrer" />
							),
						}}
						remarkPlugins={[remarkGfm]}
						className="webchat-privacy-notice-markdown-container"
					>
						{sanitizedText}
					</Markdown>
				</Typography>
			</PrivacyMessage>
			<PrivacyActions className="webchat-privacy-notice-actions">
				<AcceptButton
					className="webchat-privacy-notice-accept-button"
					onClick={onAcceptTerms}
				>
					{submitButtonText}
				</AcceptButton>
				<PolicyLink
					url={url || "https://www.cognigy.com/"}
					target="_blank"
					className="webchat-privacy-policy-link"
					text={urlText || "Privacy policy"}
				/>
			</PrivacyActions>
		</PrivacyNoticeRoot>
	);
};
