import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import React from "react";
import { Typography } from "@cognigy/chat-components";
import Modal from "../../Modal/Modal";
import Button from "../Button";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { setShowPreviousConversationsOptionsScreen } from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";
import SecondaryButton from "../SecondaryButton";

const Container = styled.div`
	display: flex;
	flex-direction: column;
`;

const OptionsContainer = styled.div`
	display: flex;
	padding: 10px 20px;
	flex-direction: column;
`;

const DeleteButtonContainer = styled.div(() => ({
	display: "flex",
	alignItems: "flex-start",
	gap: 8,
}));

const DeleteButton = styled(Button)(({ theme }) => ({
	background: theme.red,
	color: theme.white,
	width: "30%",
	"&:hover:not(:disabled)": {
		background: theme.red10,
	},
}));

const CancelButton = styled(SecondaryButton)(({ theme }) => ({
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
					<Typography
						variant="title1-semibold"
						className="webchat-delete-all-conversation-title"
					>
						{config.settings.customTranslations?.delete_all_conversations ??
							"Delete all conversations"}
					</Typography>
					<DeleteButtonContainer>
						<DeleteButton
							onClick={handleDeleteAllConversations}
							ref={button => {
								if (button && !isModalOpen) {
									button.focus();
								}
							}}
						>
							{config.settings.customTranslations?.delete ?? "Delete"}
						</DeleteButton>
					</DeleteButtonContainer>
				</OptionsContainer>
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
					config.settings.customTranslations?.delete_all_conversations ??
					"Delete all conversations"
				}
			>
				<Typography variant="body-regular">
					{config.settings.customTranslations?.delete_all_conversations_confirmation ??
						"Are you sure you want to delete all previous conversations? This action cannot be undone."}
				</Typography>
			</Modal>
		</>
	);
};

export default PreviousConversationsOptions;
