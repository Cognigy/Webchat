import React from "react";
import Modal from "./Modal";
import styled from "@emotion/styled";
import Button from "../presentational/Button";
import { getContrastColor, deriveHoverColor } from "../../style";
import SecondaryButton from "../presentational/SecondaryButton";

export const DeleteButton = styled(Button)<{ background?: string }>(({ theme, background }) => ({
	background: background ? background : theme.red30,
	color: getContrastColor(background ? background : theme.red30, theme),
	"&:hover:not(:disabled)": {
		background: deriveHoverColor(background ? background : theme.red30),
	},
}));

const CancelButton = styled(SecondaryButton)<{ background?: string }>(({ theme, background }) => ({
	background: background ? background : theme.white,
	color: getContrastColor(background ? background : theme.white, theme),
	marginRight: "auto",
}));

const DeleteConfirmation = styled(DeleteButton)(() => ({
	marginLeft: "auto",
}));

interface DeleteConfirmModalProps {
	isOpen: boolean;
	onClose: (state: boolean) => void;
	onConfirmDelete: () => void;
	title: string;
	children: React.ReactNode;
	cancelText: string;
	cancelButtonBackground?: string;
	confirmButtonBackground?: string;
	confirmText: string;
	ariaLabels?: {
		close?: string;
	};
}

const DeleteConfirmModal = (props: DeleteConfirmModalProps) => {
	const {
		isOpen,
		onClose,
		onConfirmDelete,
		title,
		children,
		cancelText,
		confirmText,
		cancelButtonBackground,
		confirmButtonBackground,
	} = props;

	// Focus the safe default (Cancel) action via the Modal's deferred focus
	// path, not React's autoFocus: autoFocus fires in the same task that
	// inserts the dialog subtree, and VoiceOver then reads a stale
	// accessibility tree — the dialog role/title and the focused button are
	// never announced (CGY-3274). The deferral lets the tree settle first.
	const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

	return (
		<Modal
			footer={
				<>
					<CancelButton
						ref={cancelButtonRef}
						className="webchat-delete-confirmation-cancel-button"
						onClick={() => onClose(false)}
						background={cancelButtonBackground}
					>
						{cancelText}
					</CancelButton>
					<DeleteConfirmation
						className="webchat-delete-confirmation-confirm-button"
						onClick={onConfirmDelete}
						background={confirmButtonBackground}
					>
						{confirmText}
					</DeleteConfirmation>
				</>
			}
			isOpen={isOpen}
			onClose={onClose}
			title={title}
			initialFocusRef={cancelButtonRef}
		>
			{children}
		</Modal>
	);
};

export default DeleteConfirmModal;
