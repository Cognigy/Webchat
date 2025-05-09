import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import PrimaryButton from "./PrimaryButton";
import PolicyLink from "./PrimaryLink";
import { IWebchatSettings } from "../../../common/interfaces/webchat-config";

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
}));

const PrivacyMessage = styled.div(() => ({}));

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
}

export const PrivacyNotice = (props: IPrivacyNoticeProps) => {
	const { privacyNotice, onAcceptTerms } = props;
	const { text, submitButtonText, urlText, url } = privacyNotice;

	return (
		<PrivacyNoticeRoot className="webchat-privacy-notice-root">
			<PrivacyMessage className="webchat-privacy-notice-message">
				<Typography variant="body-regular" style={{ whiteSpace: "pre-wrap" }}>
					{text}
				</Typography>
			</PrivacyMessage>
			<PrivacyActions className="webchat-privacy-notice-actions">
				<AcceptButton
					className="webchat-privacy-notice-accept-button"
					onClick={onAcceptTerms}
					autoFocus
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
