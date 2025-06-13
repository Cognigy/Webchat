import React, { useEffect, useRef, useMemo } from "react";
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
}));

const PrivacyMessage = styled.div(({ theme }) => ({
	":focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 8,
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
	const privacyNoticeRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isHomeScreenEnabled) {
			if (privacyNoticeRef.current) {
				privacyNoticeRef.current.focus();
			}
			return;
		}
		// If the home screen is enabled, delay focusing the privacy notice message
		// to allow any home screen transition animations to complete before moving focus.
		const timeoutId = setTimeout(() => {
			if (privacyNoticeRef.current) {
				privacyNoticeRef.current.focus();
			}
		}, 200);

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [isHomeScreenEnabled]);
	const sanitizedText = useMemo(() => sanitizeHTML(text), [text]);
	return (
		<PrivacyNoticeRoot className="webchat-privacy-notice-root">
			<PrivacyMessage
				className="webchat-privacy-notice-message"
				tabIndex={-1}
				ref={privacyNoticeRef}
			>
				<Typography variant="body-regular" style={{ whiteSpace: "pre-wrap" }}>
					<Markdown
						components={{
							p: ({ node, ...props }) => (
								<p {...props} style={{ margin: 0, whiteSpace: "pre-wrap" }} />
							),
							a: ({ node, ...props }) => (
								<a {...props} target="_blank" rel="noopener noreferrer" />
							),
						}}
						remarkPlugins={[remarkGfm]}
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
