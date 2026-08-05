import React, { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import IconButton from "../presentational/IconButton";
import CloseIcon from "../../assets/close-16px.svg";
import { CSSTransition } from "react-transition-group";
import { Typography } from "@cognigy/chat-components";
import getKeyboardFocusableElements from "../../utils/find-focusable";
import { useSelector } from "../../../webchat/helper/useSelector";

type ModalVariant = "card" | "fullscreen";

const Overlay = styled.div({
	position: "absolute",
	top: 0,
	left: 0,
	bottom: 0,
	right: 0,
	background: "rgba(0, 0, 0, 0.5)",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	zIndex: 9999,
});

const StyledDialog = styled.dialog<{ variant: ModalVariant }>(({ theme, variant }) => ({
	padding: 20,
	border: "none",
	zIndex: 99999,

	...(variant === "card"
		? {
				borderRadius: 16,
				width: "90%",
				backgroundColor: theme.white,
				margin: "20px auto",
			}
		: {
				// "fullscreen" spans the entire webchat window: the modal represents
				// a blocking state of the window itself, not a dialog above it.
				position: "absolute",
				inset: 0,
				width: "100%",
				height: "100%",
				maxWidth: "none",
				maxHeight: "none",
				margin: 0,
				borderRadius: 0,
				boxSizing: "border-box",
				backgroundColor: theme.backgroundWebchat,
				color: theme.textDark,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 24,
			}),

	"&.fade-enter": {
		opacity: 0,
	},
	"&.fade-enter-active": {
		opacity: 1,
		transition: "opacity 150ms",
	},
}));

const ModalHeader = styled.div<{ variant: ModalVariant }>(({ variant }) => ({
	display: "flex",
	alignItems: "center",

	// Static (fullscreen), so the close button anchors to the dialog's corner
	// and the title centers in the window.
	...(variant === "card" ? { position: "relative" } : { position: "static" }),

	"> h3": {
		margin: "auto",
		textAlign: "center",
		...(variant === "fullscreen" ? { fontSize: "1.2rem" } : {}),
	},
}));

const CloseButton = styled(IconButton)<{ variant: ModalVariant }>(({ theme, variant }) => ({
	color: theme.black10,
	borderRadius: 4,
	position: "absolute",
	...(variant === "card" ? { right: -4 } : { right: 15, top: 17 }),

	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
	},
	"& svg": {
		fill: theme.black10,
		width: 14,
		height: 14,
	},
	padding: 0,
}));

const ModalBody = styled.div<{ variant: ModalVariant }>(({ variant }) => ({
	...(variant === "card"
		? { marginBottom: 20 }
		: {
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 24,
				textAlign: "center",
			}),
}));

const ModalFooter = styled.div({
	display: "flex",
	justifyContent: "space-between",
	gap: 12,
	"> button": {
		width: "auto",
		padding: "0 16px",
	},

	"@media screen and (max-width: 576px)": {
		flexDirection: "column",
		gap: 12,
		"> button": {
			width: "100%",
		},
	},
});

const DividerWrapper = styled.div(() => ({
	padding: "12px 0px",
	margin: "0px -20px",
}));

const Divider = styled.div(({ theme }) => ({
	height: 1,
	width: "100%",
	backgroundColor: theme.black80,
}));

interface ModalProps extends Omit<
	React.DialogHTMLAttributes<HTMLDialogElement>,
	"title" | "onClose" | "open" | "inert" | "role" | "aria-modal"
> {
	isOpen: boolean;
	onClose: (state: boolean) => void;
	title: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	/** "card" (default): inset confirm dialog over a dimmed backdrop.
	 *  "fullscreen": spans the whole webchat window (blocking window state). */
	variant?: ModalVariant;
	/** Id for the title element / aria-labelledby target. */
	titleId?: string;
	/** Accessible name for the close (X) button; defaults to the
	 *  `closeDialog` custom translation. */
	closeButtonAriaLabel?: string;
	/** Extra props (e.g. data attributes) for the close (X) button. */
	closeButtonProps?: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color"> &
		Record<`data-${string}`, unknown>;
	/** When provided, focus moves on open to this element (falling back to
	 *  the close button when its `current` is not rendered). When omitted,
	 *  the modal does not manage initial focus (consumers may use autoFocus
	 *  on a footer action instead, e.g. DeleteConfirmModal's Cancel). */
	initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const Modal: React.FC<ModalProps> = ({
	isOpen,
	onClose,
	title,
	footer,
	children,
	variant = "card",
	titleId = "modal-title",
	closeButtonAriaLabel,
	closeButtonProps,
	initialFocusRef,
	className,
	...restDialogProps
}) => {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const previouslyFocusedRef = useRef<HTMLElement | null>(null);

	const defaultCloseButtonAriaLabel =
		useSelector(state => state.config.settings.customTranslations?.ariaLabels?.closeDialog) ??
		"Close dialog";

	const handleOnClose = () => {
		onClose(false);
	};

	// Move focus once when the dialog opens; it then stays where the user
	// puts it (SC 3.2.1, 2.4.3). On close, focus returns to the element that
	// was focused before the dialog opened (if it is still in the document —
	// e.g. not when closing the dialog closed the whole chat window). Only
	// active when the consumer opts in via initialFocusRef — see the prop docs.
	useEffect(() => {
		if (!initialFocusRef) return;
		if (isOpen) {
			previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
			// Deferred: focusing a control in the same task that inserted it is
			// not reliably announced by screen readers — the focus event races
			// the accessibility-tree update for the new dialog subtree.
			const focusTimer = window.setTimeout(() => {
				(initialFocusRef.current ?? closeButtonRef.current)?.focus();
			}, 200);
			return () => window.clearTimeout(focusTimer);
		} else {
			const previouslyFocused = previouslyFocusedRef.current;
			previouslyFocusedRef.current = null;
			if (previouslyFocused && document.contains(previouslyFocused)) {
				previouslyFocused.focus();
			}
		}
	}, [isOpen, initialFocusRef]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			// Inert means another modal surface (e.g. the disconnect overlay)
			// is stacked on top — leave Esc/Tab to that surface.
			if (dialogRef.current?.closest("[inert]")) return;
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
			{isOpen && variant === "card" && <Overlay onClick={handleOnClose} />}
			<CSSTransition in={isOpen} timeout={150} mountOnEnter unmountOnExit classNames="fade">
				<StyledDialog
					className={["webchat-modal-root", className].filter(Boolean).join(" ")}
					// The fullscreen variant renders as a plain div[role="dialog"]
					// (the APG pattern): a native <dialog open> without showModal()
					// has Chromium a11y quirks where subtree changes inside it
					// (inserted controls, focus on new nodes) are not surfaced to
					// screen readers. The card variant keeps <dialog> — its
					// centering relies on the element's UA styles.
					as={variant === "fullscreen" ? "div" : undefined}
					// Spread first so the dialog semantics below always win over
					// anything a consumer passes through.
					{...restDialogProps}
					role="dialog"
					{...(variant === "card" ? { open: isOpen } : {})}
					variant={variant}
					aria-modal="true"
					aria-labelledby={titleId}
					// Only the card variant uses the body as the dialog description —
					// the fullscreen body contains a live region (role="status"),
					// which would otherwise be announced twice (as description on
					// dialog entry and again as a live-region update).
					aria-describedby={variant === "card" ? "modal-body" : undefined}
					ref={dialogRef}
				>
					<ModalHeader className="webchat-modal-header" variant={variant}>
						<Typography
							id={titleId}
							variant="title1-semibold"
							className="webchat-modal-title"
						>
							{title}
						</Typography>
						<CloseButton
							aria-label={closeButtonAriaLabel ?? defaultCloseButtonAriaLabel}
							onClick={handleOnClose}
							variant={variant}
							ref={closeButtonRef}
							{...closeButtonProps}
							className={["webchat-modal-close-button", closeButtonProps?.className]
								.filter(Boolean)
								.join(" ")}
						>
							<CloseIcon aria-hidden className="webchat-modal-close-icon" />
						</CloseButton>
					</ModalHeader>
					{variant === "card" && (
						<DividerWrapper className="webchat-modal-divider-wrapper">
							<Divider className="webchat-modal-divider" />
						</DividerWrapper>
					)}
					{/* The id is the card variant's aria-describedby target; unset
					    otherwise so stacked modals (e.g. delete-confirm under the
					    disconnect overlay) don't produce duplicate ids. */}
					<ModalBody
						id={variant === "card" ? "modal-body" : undefined}
						className="webchat-modal-body"
						variant={variant}
					>
						{children}
					</ModalBody>
					{footer ? (
						<ModalFooter className="webchat-modal-footer">{footer}</ModalFooter>
					) : null}
				</StyledDialog>
			</CSSTransition>
		</>
	);
};

export default Modal;
