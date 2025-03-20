import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Typography } from "@cognigy/chat-components";
import Modal from "../../Modal/Modal";
import { deletePrevConversation } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { setShowChatOptionsScreen } from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";
import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { clearMessages } from "../../../../webchat/store/messages/message-reducer";
import Button from "../Button";
import SecondaryButton from "../SecondaryButton";

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
`;

const DeleteButton = styled(Button)(({ theme }) => ({
	background: theme.red,
	color: theme.white,
	width: "30%",
	"&:hover:not(:disabled)": {
		background: theme.red10,
		color: theme.black10,
	},
}));

const CancelButton = styled(SecondaryButton)(() => ({
	marginRight: "auto",
	width: "30%",
}));

const DeleteAnywaysButton = styled(Button)(({ theme }) => ({
	color: theme.white,
	background: theme.red,
	marginLeft: "auto",
	width: "30%",
	"&:hover:not(:disabled)": {
		background: theme.red10,
		color: theme.black10,
	},
}));

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
					onClick={handleDeleteAllConversations}
				>
					{config.settings.customTranslations?.delete ?? "Delete"}
				</DeleteButton>
			</Container>
			<Modal
				footer={
					<>
						<CancelButton onClick={handleCloseModal}>
							{config.settings.customTranslations?.cancel ?? "Cancel"}
						</CancelButton>
						<DeleteAnywaysButton onClick={handleConfirmDelete}>
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
				<Typography variant="body-regular" className="webchat-delete-conversation-text">
					{config.settings.customTranslations?.delete_conversation_confirmation ??
						"Are you sure you want to delete this conversation? This action cannot be undone"}
				</Typography>
			</Modal>
		</>
	);
};

export default DeleteConversation;
