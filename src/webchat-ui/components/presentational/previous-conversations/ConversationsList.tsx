import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { ConversationsListItem } from "./ConversationsListItem";
import PrimaryButton from "../PrimaryButton";
import { PrevConversationsState } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import Branding from "../../branding/Branding";
import { sortConversationsByFreshness } from "./helpers";

const ConversationsListRoot = styled.div(({ theme }) => ({
	height: "100%",
	width: "100%",
	fontSize: 16,
	fontWeight: 700,
	boxSizing: "border-box",
	backgroundColor: theme.white,
	display: "flex",
	flexDirection: "column",
	"& *": {
		boxSizing: "border-box",
	},
}));

const ConversationsList = styled.div(({ theme }) => ({
	rowGap: "8px",
	display: "flex",
	flexDirection: "column",
	padding: "20px",
	overflowY: "auto",
	flexGrow: 1,
	minHeight: 0,
	height: theme.blockSize,
	overscrollBehavior: "contain",
	"&:focus": {
		outline: "none",
	},
}));

// Programmatic focus target (tabIndex -1, not in the Tab order): after
// "Delete all conversations" focus lands here so the outcome is read out
// without a live region (SC 4.1.3, CGY-39786). Centred in the empty list;
// the focus ring shows for keyboard-initiated focus (SC 2.4.7).
const EmptyListText = styled.p(({ theme }) => ({
	margin: "auto",
	padding: "4px 8px",
	fontSize: 16,
	fontWeight: 400,
	lineHeight: "24px",
	textAlign: "center",
	color: theme.black10,
	"&:focus": {
		outline: "none",
	},
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
	},
}));

const ConversationsListActions = styled.div(({ theme }) => ({
	alignSelf: "flex-end",
	display: "flex",
	flexDirection: "column",
	alignItems: " center",
	justifyContent: "center",
	width: "100%",
	padding: "20px 20px 12px 20px",
	backgroundColor: theme.white,
	borderTop: `1px solid var(--basics-black-80, ${theme.black80})`,
}));

const StartButton = styled(PrimaryButton)(({ theme }) => ({
	marginBottom: 20,
	flexGrow: 1,
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
	},
}));

interface IPrevConversationsListProps {
	config: IWebchatConfig;
	currentSession?: string;
	conversations: PrevConversationsState;
	onSetShowPrevConversations: (show: boolean) => void;
	onSwitchSession: (sessionId?: string, conversation?: PrevConversationsState[string]) => void;
	startNewConversationButtonRef?: React.RefObject<HTMLButtonElement>;
	emptyListTextRef?: React.RefObject<HTMLParagraphElement>;
}

export const PrevConversationsList = (props: IPrevConversationsListProps) => {
	const {
		conversations,
		config,
		onSetShowPrevConversations,
		onSwitchSession,
		currentSession,
		startNewConversationButtonRef,
		emptyListTextRef,
	} = props;

	// we sort the conversation based on last message timestamp
	// result: the last updated conversation goes on top
	const sortedConversations = sortConversationsByFreshness(conversations);

	const sessions = Object.keys(sortedConversations);

	const handleStartButtonClick = () => {
		// we initialize a new session
		onSwitchSession();
		onSetShowPrevConversations(false);
	};

	const switchSession = useCallback(
		(sessionId?: string, conversation?: PrevConversationsState[string]) => {
			if (sessionId && sessionId !== currentSession) {
				onSwitchSession(sessionId, conversation);
			}
			onSetShowPrevConversations(false);
		},
		[],
	);

	return (
		<ConversationsListRoot className="webchat-prev-conversations-root">
			<ConversationsList className="webchat-prev-conversations-content">
				{sessions.length === 0 && (
					<EmptyListText
						className="webchat-prev-conversations-empty"
						ref={emptyListTextRef}
						tabIndex={-1}
					>
						{config.settings.homeScreen?.previousConversations?.emptyListText ||
							"No previous conversations"}
					</EmptyListText>
				)}
				{sessions.length > 0 &&
					sessions.map((session, i) => {
						return (
							<ConversationsListItem
								key={i}
								index={i}
								sessionId={session}
								switchSession={switchSession}
								conversation={sortedConversations[session]}
								config={config}
							/>
						);
					})}
			</ConversationsList>
			<ConversationsListActions className="webchat-prev-conversations-actions">
				<StartButton
					onClick={handleStartButtonClick}
					className="webchat-prev-conversations-send-button"
					data-testid="webchat-start-chat-button"
					ref={startNewConversationButtonRef}
				>
					{config.settings.homeScreen?.previousConversations
						?.startNewConversationButtonText ?? "Start new conversation"}
				</StartButton>
				<Branding
					id="cognigyConversationListBranding"
					watermark={config?.settings?.layout?.watermark}
					watermarkText={config?.settings?.layout?.watermarkText}
					watermarkUrl={config?.settings?.layout?.watermarkUrl}
				/>
			</ConversationsListActions>
		</ConversationsListRoot>
	);
};
