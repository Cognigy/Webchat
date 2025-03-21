import React from "react";
import Modal from "./Modal";
import styled from "@emotion/styled";
import Button from "../presentational/Button";
import { getTextContrastColor, deriveHoverColor } from "../../style";
import SecondaryButton from "../presentational/SecondaryButton";

export const DeleteButton = styled(Button)<{ background?: string }>(({ theme, background }) => ({
	background: background ? background : theme.red20,
	color: getTextContrastColor(background ? background : theme.red20, theme),
	"&:hover:not(:disabled)": {
		background: deriveHoverColor(background ? background : theme.red20),
	},
}));

const CancelButton = styled(SecondaryButton)<{ background?: string }>(({ theme, background }) => ({
	background: background ? background : theme.white,
	color: getTextContrastColor(background ? background : theme.white, theme),
	marginRight: "auto",
}));

const DeleteConfirmation = styled(DeleteButton)(({ theme }) => ({
	marginLeft: "auto",
}));

interface DeleteConfirmModal {
	isOpen: boolean;
	onClose: (state: boolean) => void;
	onConfirmDelete: () => void;
	title: string;
	children: React.ReactNode;
	cancelText: string;
	confirmText: string;
}

const DeleteConfirmModal = (props: DeleteConfirmModal) => {
	const { isOpen, onClose, onConfirmDelete, title, children, cancelText, confirmText } = props;

	return (
		<Modal
			footer={
				<>
					<CancelButton
						className="webchat-delete-conversation-cancel-button"
						onClick={() => onClose(!isOpen)}
					>
						{cancelText}
					</CancelButton>
					<DeleteConfirmation
						className="webchat-delete-conversation-confirm-button"
						onClick={onConfirmDelete}
					>
						{confirmText}
					</DeleteConfirmation>
				</>
			}
			isOpen={isOpen}
			onClose={onClose}
			title={title}
		>
			{children}
		</Modal>
	);
};

export default DeleteConfirmModal;
