import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { Typography } from "@cognigy/chat-components";
import PrimaryButton from "./PrimaryButton";
import { IWebchatSettings } from "../../../common/interfaces/webchat-config";
import Markdown from "react-markdown";
import { sanitizeHTML } from "../../../webchat/helper/sanitize";
import remarkGfm from "remark-gfm";

const Root = styled.div(({ theme }) => ({
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

const Message = styled.div(({ theme }) => ({
	":focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 8,
	},

	".webchat-sun-markdown-container > p": {
		margin: 0,
		whiteSpace: "pre-wrap",
	},
}));

const Actions = styled.div({
	display: "flex",
	alignItems: "center",
	flexDirection: "column",
	gap: 16,
});

const AcceptButton = styled(PrimaryButton)(() => ({
	width: 303,
}));

interface ISystemUseNotificationProps {
	systemUseNotification: NonNullable<IWebchatSettings["systemUseNotification"]>;
	onAccept: () => void;
}

export const SystemUseNotification = (props: ISystemUseNotificationProps) => {
	const { systemUseNotification, onAccept } = props;
	const { text, submitButtonText } = systemUseNotification;

	const sanitizedText = useMemo(() => sanitizeHTML(text || ""), [text]);

	return (
		<Root className="webchat-system-use-notification-root">
			<Message className="webchat-system-use-notification-message">
				<Typography variant="body-regular" style={{ whiteSpace: "pre-wrap" }}>
					<Markdown
						components={{
							a: ({ node, ...props }) => (
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a {...props} target="_blank" rel="noopener noreferrer" />
							),
						}}
						remarkPlugins={[remarkGfm]}
						className="webchat-sun-markdown-container"
					>
						{sanitizedText}
					</Markdown>
				</Typography>
			</Message>
			<Actions className="webchat-system-use-notification-actions">
				<AcceptButton
					className="webchat-system-use-notification-accept-button"
					onClick={onAccept}
				>
					{submitButtonText || "I acknowledge and accept"}
				</AcceptButton>
			</Actions>
		</Root>
	);
};
