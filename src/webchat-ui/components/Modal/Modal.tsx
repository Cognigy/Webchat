import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import IconButton from "../presentational/IconButton";
import CloseIcon from "../../assets/close-16px.svg";
import { CSSTransition } from "react-transition-group";
import { Typography } from "@cognigy/chat-components";
import getKeyboardFocusableElements from "../../utils/find-focusable";

const Overlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 9999;
`;

const StyledDialog = styled.dialog`
	padding: 20px;
	border: none;
	border-radius: 16px;
	width: 90%;
	background-color: ${({ theme }) => theme.white};
	margin: 20px auto;
	z-index: 99999;

	&.fade-enter {
		opacity: 0;
	}
	&.fade-enter-active {
		opacity: 1;
		transition: opacity 150ms;
	}
`;

const ModalHeader = styled.div`
	display: flex;
	align-items: center;

	> h3 {
		margin: 0;
		margin-left: auto;
	}
`;

const CloseButton = styled(IconButton)(({ theme }) => ({
	color: theme.black10,
	borderRadius: 4,
	marginLeft: "auto",

	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
	"& svg": {
		fill: theme.black10,
		width: 14,
		height: 14,
	},
	padding: 0,
}));

const ModalBody = styled.div`
	margin-bottom: 20px;
`;

const ModalFooter = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 12px;
	> button {
	 	width: auto;
		padding: 0 16px;
	 }
	
	@media screen and (max-width: 576px) {
		flex-direction: column;
		gap: 12px;
		> button {
	 		width:100%;
	 	}
	},
`;

const DividerWrapper = styled.div(() => ({
	padding: "12px 0px",
	margin: "0px -20px",
}));

const Divider = styled.div(({ theme }) => ({
	height: 1,
	width: "100%",
	backgroundColor: theme.black80,
}));

interface ModalProps {
	isOpen: boolean;
	onClose: (state: boolean) => void;
	title: string;
	children: React.ReactNode;
	footer: React.ReactNode;
	ariaLabels?: {
		close?: string;
	};
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, footer, children, ariaLabels }) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const handleOnClose = () => {
		onClose(false);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				handleOnClose();
			}
			const isTabKey =
				event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
			const focusedElement = document.activeElement as HTMLElement | null;
			if (focusedElement && isTabKey) {
				const { firstFocusable, lastFocusable } = getKeyboardFocusableElements(
					dialogRef.current as HTMLElement,
				);
				const first = firstFocusable === focusedElement;
				const last = lastFocusable === focusedElement;
				if (first && event.shiftKey) {
					event.preventDefault();
					lastFocusable.focus();
				}
				if (last && !event.shiftKey) {
					event.preventDefault();
					firstFocusable.focus();
				}
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
		} else {
			document.removeEventListener("keydown", handleKeyDown);
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	return (
		<>
			{isOpen && <Overlay onClick={handleOnClose} />}
			<CSSTransition in={isOpen} timeout={150} mountOnEnter unmountOnExit classNames="fade">
				<StyledDialog
					className="webchat-modal-root"
					open={isOpen}
					aria-labelledby="modal-title"
					aria-describedby="modal-body"
					ref={dialogRef}
				>
					<ModalHeader className="webchat-modal-header">
						<Typography
							id="modal-title"
							variant="title1-semibold"
							className="webchat-modal-title"
						>
							{title}
						</Typography>
						<CloseButton
							aria-label={ariaLabels?.close ?? "Close"}
							onClick={handleOnClose}
							className="webchat-modal-close-button"
						>
							<CloseIcon aria-hidden className="webchat-modal-close-icon" />
						</CloseButton>
					</ModalHeader>
					<DividerWrapper className="webchat-modal-divider-wrapper">
						<Divider className="webchat-modal-divider" />
					</DividerWrapper>
					<ModalBody id="modal-body" className="webchat-modal-body">
						{children}
					</ModalBody>
					<ModalFooter className="webchat-modal-footer">{footer}</ModalFooter>
				</StyledDialog>
			</CSSTransition>
		</>
	);
};

export default Modal;
