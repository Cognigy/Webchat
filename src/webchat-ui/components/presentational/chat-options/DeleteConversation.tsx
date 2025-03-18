import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography } from "@cognigy/chat-components";
import Modal from "../../Modal/Modal";
import {
	upsertPrevConversation,
	deletePrevConversation,
} from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import {
	setShowPreviousConversationsOptionsScreen,
	setShowPrevConversations,
	setShowChatOptionsScreen,
} from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";
import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { clearMessages } from "../../../../webchat/store/messages/message-reducer";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`;

const DeleteButton = styled.button`
	background-color: #ff4d4f;
	color: white;
	border: none;
	padding: 8px 16px;
	cursor: pointer;
	border-radius: 4px;
	&:hover {
		background-color: #ff7875;
	}
`;

const CancelButton = styled.button`
	background-color: #d9d9d9;
	color: black;
	border: none;
	padding: 8px 16px;
	cursor: pointer;
	border-radius: 4px;
	margin-right: 8px;
	&:hover {
		background-color: #bfbfbf;
	}
`;

const DeleteAnywaysButton = styled.button`
	background-color: #ff4d4f;
	color: white;
	border: none;
	padding: 8px 16px;
	cursor: pointer;
	border-radius: 4px;
	&:hover {
		background-color: #ff7875;
	}
`;

interface DeleteConversationProps {
	config: IWebchatConfig;
}

const DeleteConversation = (props: DeleteConversationProps) => {
	const { config } = props;
	const { userId, sessionId } = useSelector((state: StoreState) => state.options);
	const conversations = useSelector((state: StoreState) => state.prevConversations);
	const dispatch = useDispatch();
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const handleDeleteAllConversations = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleConfirmDelete = () => {
		dispatch(deletePrevConversation(sessionId));
		dispatch(clearMessages());
		const storage = getStorage({
			disableLocalStorage:
				props.config.settings.embeddingConfiguration?.disableLocalStorage ?? false,
			useSessionStorage:
				props.config.settings.embeddingConfiguration?.useSessionStorage ?? false,
		});
		if (storage) {
			Object.keys(storage).forEach(key => {
				if (key.includes(userId) && key.includes(sessionId)) {
					storage.removeItem(key);
				}
			});
		}
		setIsModalOpen(false);
		dispatch(setShowChatOptionsScreen(false));
	};

	return (
		<>
			<Container>
				<Typography variant="title1-semibold" className="webchat-rating-widget-title">
					{config.settings.customTranslations?.delete_conversation ??
						"Delete conversation"}
				</Typography>
				<DeleteButton
					onClick={handleDeleteAllConversations}
					aria-label="Delete all conversations"
				>
					{config.settings.customTranslations?.delete ?? "Delete"}
				</DeleteButton>
			</Container>
			<Modal
				footer={
					<>
						<CancelButton onClick={handleCloseModal} aria-label="Cancel deletion">
							{config.settings.customTranslations?.cancel ?? "Cancel"}
						</CancelButton>
						<DeleteAnywaysButton
							onClick={handleConfirmDelete}
							aria-label="Confirm deletion"
						>
							{config.settings.customTranslations?.delete_anyway ?? "Delete anyway"}
						</DeleteAnywaysButton>
					</>
				}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				title={
					config.settings.customTranslations?.delete_conversation ?? "Delete conversation"
				}
			>
				<Typography variant="body-semibold">
					{config.settings.customTranslations?.delete_conversation_confirmation ??
						"You are about to delete the conversation. This action cannot be undone."}
				</Typography>
			</Modal>
		</>
	);
};

export default DeleteConversation;
