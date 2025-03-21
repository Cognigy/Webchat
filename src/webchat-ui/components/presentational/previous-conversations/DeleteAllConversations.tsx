import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import React, { PropsWithChildren } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setConversations } from "../../../../webchat/store/previous-conversations/previous-conversations-reducer";
import { getStorage } from "../../../../webchat/helper/storage";
import { setShowPreviousConversationsOptionsScreen } from "../../../../webchat/store/ui/ui-reducer";
import { StoreState } from "../../../../webchat/store/store";
import DeleteConfirmModal from "../../Modal/DeleteConfirmModal";
import { Typography } from "@cognigy/chat-components";

interface DeleteAllConversationsProps {
	config: IWebchatConfig;
}

const DeleteAllConversationsModal = (
	props: DeleteAllConversationsProps & {
		isOpen: boolean;
		onOpenChange: (open: boolean) => void;
	},
) => {
	const { config, onOpenChange, isOpen } = props;
	const { userId } = useSelector((state: StoreState) => state.options);
	const dispatch = useDispatch();

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
		onOpenChange(false);
		dispatch(setShowPreviousConversationsOptionsScreen(false));
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
