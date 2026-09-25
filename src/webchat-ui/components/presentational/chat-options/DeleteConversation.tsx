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
import { switchSession } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getOptionsKey } from "../../../../webchat/store/options/options";
import { announceStatus } from "../StatusLiveRegion";

// The chat screen that replaces this one autofocuses the message input 200ms
// after it mounts; the announcement is delayed past that so it follows the
// focus utterance instead of being cancelled by it (same reasoning as
// HomeScreenAnnouncer's 600ms).
const ANNOUNCE_DELAY_MS = 600;

const Container = styled.div({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	"& > button": {
		width: "auto",
		padding: "0 16px",
	},
});

const DeleteButton = styled(ConfirmDeleteButton)``;

interface DeleteConversationProps {
	config: IWebchatConfig;
	onDeleteModalStateChange: (open: boolean) => void;
}

const DeleteConversation = (props: DeleteConversationProps) => {
	const { config, onDeleteModalStateChange } = props;
	const { userId, sessionId, channel } = useSelector((state: StoreState) => state.options);
	const dispatch = useDispatch();
	const [isModalOpen, setIsModalOpen] = React.useState(false);
	const deleteButtonRef = React.useRef<HTMLButtonElement>(null);
	const handleDeleteConversation = () => {
		setIsModalOpen(true);
		onDeleteModalStateChange(true);
	};

	const handleConfirmDelete = () => {
		dispatch(deletePrevConversation(sessionId));
		dispatch(clearMessages());
		dispatch(switchSession());
		const storage = getStorage({
			disableLocalStorage:
				props.config.settings.embeddingConfiguration?.disableLocalStorage ?? false,
			useSessionStorage:
				props.config.settings.embeddingConfiguration?.useSessionStorage ?? false,
		});
		if (storage) {
			Object.keys(storage).forEach(_ => {
				const key = getOptionsKey(
					{ channel, userId, sessionId },
					{ URLToken: props.config.URLToken },
				);
				storage.removeItem(key);
			});
		}
		setIsModalOpen(false);
		onDeleteModalStateChange(false);
		deleteButtonRef.current?.focus();
		dispatch(setShowChatOptionsScreen(false));
		// Status message for the completed deletion (SC 4.1.3, CGY-39786). The
		// live region lives in the open chat window and survives this screen's
		// unmount; announceStatus is a no-op if the window was closed meanwhile.
		const conversationDeletedText =
			config.settings.customTranslations?.conversation_deleted ?? "Conversation deleted";
		window.setTimeout(() => announceStatus(conversationDeletedText), ANNOUNCE_DELAY_MS);
	};

	return (
		<>
			<Container className="webchat-delete-conversation-container">
				<Typography variant="title1-semibold" className="webchat-delete-conversation-title">
					{config.settings.customTranslations?.delete_conversation ??
						"Delete conversation"}
				</Typography>
				<DeleteButton
					ref={deleteButtonRef}
					className="webchat-delete-conversation-button"
					background={config.settings.customColors?.deleteButtonColor}
					onClick={handleDeleteConversation}
				>
					{config.settings.customTranslations?.delete ?? "Delete"}
				</DeleteButton>
			</Container>
			<DeleteConfirmModal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false);
					deleteButtonRef.current?.focus();
				}}
				onConfirmDelete={handleConfirmDelete}
				title={
					config.settings.customTranslations?.delete_conversation ?? "Delete conversation"
				}
				cancelText={config.settings.customTranslations?.cancel ?? "Cancel"}
				confirmText={config.settings.customTranslations?.delete_anyway ?? "Delete anyway"}
				cancelButtonBackground={config.settings.customColors?.cancelButtonColor}
				confirmButtonBackground={config.settings.customColors?.deleteButtonColor}
			>
				<Typography variant="body-regular" className="webchat-delete-conversation-text">
					{config.settings.customTranslations?.delete_conversation_confirmation ??
						"Are you sure you want to delete this conversation? This action cannot be undone."}
				</Typography>
			</DeleteConfirmModal>
		</>
	);
};

export default DeleteConversation;
