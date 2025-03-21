import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography } from "@cognigy/chat-components";
import { deletePrevConversation } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { setShowChatOptionsScreen } from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";
import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { clearMessages } from "../../../../webchat/store/messages/message-reducer";
import DeleteConfirmModal, {
	DeleteButton as ConfirmDeleteButton,
} from "../../Modal/DeleteConfirmModal";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	> button {
		width: 30%;
	}
`;

const DeleteButton = styled(ConfirmDeleteButton)``;

interface DeleteConversationProps {
	config: IWebchatConfig;
}

const DeleteConversation = (props: DeleteConversationProps) => {
	const { config } = props;
	const { userId, sessionId } = useSelector((state: StoreState) => state.options);
	const dispatch = useDispatch();
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const handleDeleteAllConversations = () => {
		setIsModalOpen(true);
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
			<Container className="webchat-delete-conversation-container">
				<Typography variant="title1-semibold" className="webchat-delete-conversation-title">
					{config.settings.customTranslations?.delete_conversation ??
						"Delete conversation"}
				</Typography>
				<DeleteButton
					ref={button => {
						if (button && !isModalOpen) {
							button.focus();
						}
					}}
					className="webchat-delete-conversation-button"
					background={config.settings.customColors?.deleteButtonColor}
					onClick={handleDeleteAllConversations}
				>
					{config.settings.customTranslations?.delete ?? "Delete"}
				</DeleteButton>
			</Container>
			<DeleteConfirmModal
				isOpen={isModalOpen}
				onClose={setIsModalOpen}
				onConfirmDelete={handleConfirmDelete}
				title={
					config.settings.customTranslations?.delete_conversation ?? "Delete conversation"
				}
				cancelText={config.settings.customTranslations?.cancel ?? "Cancel"}
				confirmText={config.settings.customTranslations?.delete_anyway ?? "Delete anyway"}
			>
				<Typography variant="body-regular" className="webchat-delete-conversation-text">
					{config.settings.customTranslations?.delete_conversation_confirmation ??
						"Are you sure you want to delete this conversation? This action cannot be undone"}
				</Typography>
			</DeleteConfirmModal>
		</>
	);
};

export default DeleteConversation;
