import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { StoreState } from "../../../../webchat/store/store";
import DeleteConfirmModal from "../../Modal/DeleteConfirmModal";
import { Typography } from "@cognigy/chat-components";
import { disconnect } from "../../../../webchat/store/connection/connection-middleware";
import { clearMessages } from "../../../../webchat/store/messages/message-reducer";
import { switchSession } from "../../../../webchat/store/previous-conversations/previous-conversations-middleware";

interface DeleteAllConversationsProps {
	config: IWebchatConfig;
}

const DeleteAllConversationsModal = (
	props: DeleteAllConversationsProps & {
		isOpen: boolean;
		onOpenChange: (open: boolean, confirmDelete?: boolean) => void;
	},
) => {
	const { config, onOpenChange, isOpen } = props;
	const { userId, channel } = useSelector((state: StoreState) => state.options);
	const dispatch = useDispatch();

	const handleConfirmDelete = () => {
		dispatch(setConversations({}));
		dispatch(clearMessages()); // Clear any existing messages
		dispatch(switchSession()); // Switch the session to a new one
		dispatch(disconnect()); // Disconnect the socket to prevent from receiving any new messages. Socket will be reconnected upon starting a new conversation
		const storage = getStorage({
			disableLocalStorage:
				config.settings.embeddingConfiguration?.disableLocalStorage ?? false,
			useSessionStorage: config.settings.embeddingConfiguration?.useSessionStorage ?? false,
		});
		if (storage) {
			Object.keys(storage).forEach(key => {
				if (key.includes(userId) && key.includes(channel)) {
					storage.removeItem(key);
				}
			});
		}
		onOpenChange(false, true);
	};

	return (
		<>
			<DeleteConfirmModal
				isOpen={isOpen}
				onClose={onOpenChange}
				onConfirmDelete={handleConfirmDelete}
				title={
					config.settings.customTranslations?.delete_all_conversations ??
					"Delete all conversations"
				}
				cancelText={config.settings.customTranslations?.cancel ?? "Cancel"}
				confirmText={config.settings.customTranslations?.delete_anyway ?? "Delete anyway"}
				cancelButtonBackground={config.settings.customColors?.cancelButtonColor}
				confirmButtonBackground={config.settings.customColors?.deleteButtonColor}
				ariaLabels={{
					close: config.settings.customTranslations?.ariaLabels?.closeDialog,
				}}
			>
				<Typography variant="body-regular" className="webchat-delete-all-conversation-text">
					{config.settings.customTranslations?.delete_all_conversations_confirmation ??
						"Are you sure you want to delete all previous conversations? This action cannot be undone."}
				</Typography>
			</DeleteConfirmModal>
		</>
	);
};

export default DeleteAllConversationsModal;
