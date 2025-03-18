import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import React from "react";
import { Typography } from "@cognigy/chat-components";
import IconButton from "../IconButton";
import Modal from "../../Modal/Modal";
import Button from "../Button";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { setShowPreviousConversationsOptionsScreen } from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";

const Container = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
`;

const OptionsContainer = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	padding: 0px 20px;
	flex-direction: column;
	overflow-y: auto;
`;

const DeleteButtonContainer = styled.div(() => ({
	width: "100%",
	display: "flex",
	alignItems: "flex-start",
	gap: 8,
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
	background: theme.red,
	display: "flex",
	padding: "12px 16px",
	justifyContent: "center",
	alignItems: "center",
	gap: 16,
	borderRadius: 15,
	color: theme.white,
	"&: focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
}));

const CancelButton = styled(Button)(({ theme }) => ({
	color: theme.black10,
	width: "auto",
	display: "flex",
	padding: "12px",
	borderRadius: 12,
	border: `1px solid ${theme.greyColor}`,
	"&: focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
}));

const DeleteAnywaysButton = styled(Button)(({ theme }) => ({
	color: theme.white,
	background: theme.red,
	width: "auto",
	padding: "12px",
	borderRadius: 12,
	"&: focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
	"&:hover:not(:disabled)": {
		backgroundColor: theme.red10,
	},
}));

interface PreviousConversationsOptionsProps {
	config: IWebchatConfig;
}

const PreviousConversationsOptions = (props: PreviousConversationsOptionsProps) => {
	const { config } = props;
	const { userId } = useSelector((state: StoreState) => state.options);
	const dispatch = useDispatch();
	const [isModalOpen, setIsModalOpen] = React.useState(false);

	const handleDeleteAllConversations = () => {
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
	};

	const handleConfirmDelete = () => {
		dispatch(setConversations({}));
		const storage = getStorage({
			disableLocalStorage:
				props.config.settings.embeddingConfiguration?.disableLocalStorage ?? false,
			useSessionStorage:
				props.config.settings.embeddingConfiguration?.useSessionStorage ?? false,
		});
		if (storage) {
			Object.keys(storage).forEach(key => {
				if (key.includes(userId)) {
					storage.removeItem(key);
				}
			});
		}
		setIsModalOpen(false);
		dispatch(setShowPreviousConversationsOptionsScreen(false));
	};

	return (
		<>
			<Container>
				<OptionsContainer>
					<Typography variant="title1-semibold" className="webchat-rating-widget-title">
						{config.settings.customTranslations?.delete_all_conversations ??
							"Delete all conversations"}
					</Typography>
					<DeleteButtonContainer>
						<DeleteButton
							onClick={handleDeleteAllConversations}
							aria-label="Delete all conversations"
						>
							{config.settings.customTranslations?.delete ?? "Delete"}
						</DeleteButton>
					</DeleteButtonContainer>
				</OptionsContainer>
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
							{config.settings.customTranslations?.delete_anyways ?? "Delete anyways"}
						</DeleteAnywaysButton>
					</>
				}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				title="Delete all conversations"
			>
				<Typography variant="body-semibold">
					{config.settings.customTranslations?.delete_all_conversations_confirmation ??
						"You are about to delete all the conversation. This action cannot be undone. Are you sure?"}
				</Typography>
			</Modal>
		</>
	);
};

export default PreviousConversationsOptions;
