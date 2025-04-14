import React, { FC } from "react";
import styled from "@emotion/styled";
import IconButton from "./IconButton";
import CloseIcon from "../../assets/close-16px.svg";
import MinimizeIcon from "../../assets/minimize-16px.svg";
import GoBackIcon from "../../assets/arrow-back-16px.svg";
import MenuIcon from "../../assets/menu-16px.svg";
import Notifications from "./Notifications";
import classnames from "classnames";
import { Typography } from "@cognigy/chat-components";
import CognigyAIAvatar from "../../assets/cognigy-ai-avatar-48px.svg";
import { getContrastColor } from "../../style";
import DeleteIcon from "../../assets/bin-16px.svg";
import { useSelector } from "../../../webchat/helper/useSelector";

const HeaderBar = styled.div(({ theme }) => ({
	alignItems: "center",
	borderBottom: `1px solid ${theme.black80}`,
	backgroundColor: theme.backgroundWebchat,
	position: "relative",
	color: getContrastColor(theme.backgroundWebchat),
	display: "flex",
	flexShrink: 0,
	fontSize: 18,
	fontWeight: 600,
	lineHeight: 1.3,
	margin: 0,
	padding: "20px 16px",
	resize: "vertical",
	textAlign: "center",
	zIndex: 3,
	"& .logoNameContainer": {
		alignItems: "center",
		display: "flex",
		flexDirection: "row",
		height: 28,
		marginInline: "auto",
		gap: 8,
		"& .webchat-header-logo": {
			borderRadius: "50%",
			width: 28,
			height: 28,
		},
		"& .webchat-header-cognigy-logo": {
			borderRadius: "50%",
			width: 28,
			height: 28,
		},
	},

	"&.slide-in-enter": {
		transform: "translateY(-100%)",
	},
	"&.slide-in-enter-active": {
		transform: "translateY(0%)",
		transition: "transform 400ms ease-out",
	},
	"&.slide-in-exit": {
		transform: "translateY(0%)",
	},
	"&.slide-in-exit-active": {
		transform: "translateY(-100%)",
		transition: "transform 400ms ease-out",
	},
}));

const BackButtonWrapper = styled.div(() => ({
	display: "flex",
	gap: 24,
}));

const HeaderIconsWrapper = styled.div(() => ({
	display: "flex",
	alignItems: "flex-start",
	gap: 16,
}));

const HeaderIconButton = styled(IconButton)<{ iconColor?: string }>(({ theme, iconColor }) => ({
	color: theme.black10,
	borderRadius: 4,
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
	"& svg": {
		fill: iconColor ? iconColor : theme.black10,
		width: 16,
		height: 16,
		"& path": {
			fill: iconColor ? iconColor : theme.black10,
		},
	},
	padding: 0,
}));

export const Logo = styled.img(() => ({
	borderRadius: "50%",
	fontSize: 12,
	width: 28,
	height: 28,
	marginInline: 8,
}));

interface HeaderProps {
	title: string;
	logoUrl?: string;
	isChatOptionsButtonVisible?: boolean;
	isDeleteAllConversationsButtonVisible?: boolean;
	onDeleteAllConversations?: () => void;
	onClose?: () => void;
	onMinimize?: () => void;
	onGoBack?: () => void;
	onSetShowChatOptionsScreen?: (show: boolean) => void;
	closeButtonRef?: React.RefObject<HTMLButtonElement>;
	menuButtonRef?: React.RefObject<HTMLButtonElement>;
	deleteButtonRef?: React.RefObject<HTMLButtonElement>;
	chatToggleButtonRef?: React.RefObject<HTMLButtonElement>;
	hideBackButton?: boolean;
	deleteIconColor?: string;
	showChatScreen?: boolean;
}

const Header: FC<HeaderProps> = props => {
	const {
		logoUrl,
		title,
		onClose,
		onMinimize,
		onGoBack,
		onSetShowChatOptionsScreen,
		closeButtonRef,
		menuButtonRef,
		chatToggleButtonRef,
		isChatOptionsButtonVisible,
		hideBackButton,
		showChatScreen,
		onDeleteAllConversations,
		...rest
	} = props;

	const ariaLabels = useSelector(state => state.config.settings.customTranslations?.ariaLabels);
	const settings = useSelector(state => state.config.settings);

	const handleCloseClick = () => {
		onClose?.();
		// Restore focus to chat toggle button
		chatToggleButtonRef?.current?.focus?.();
	};

	const handleMenuClick = () => {
		onSetShowChatOptionsScreen?.(true);
	};
	return (
		<>
			<HeaderBar {...rest} className="webchat-header-bar">
				{onGoBack && !hideBackButton && (
					<BackButtonWrapper style={{ width: isChatOptionsButtonVisible ? 64 : 24 }}>
						<HeaderIconButton
							data-header-back-button
							onClick={onGoBack}
							className="webchat-header-back-button cc-rtl-flip"
							aria-label={ariaLabels?.goBack ?? "Go Back"}
							ref={closeButtonRef}
						>
							<GoBackIcon />
						</HeaderIconButton>
					</BackButtonWrapper>
				)}
				<div className={classnames("logoNameContainer")}>
					{showChatScreen &&
						(logoUrl ? (
							<Logo
								src={logoUrl}
								className={classnames("webchat-header-logo")}
								alt="Chat logo"
							/>
						) : (
							<CognigyAIAvatar
								className={classnames("webchat-header-cognigy-logo")}
							/>
						))}
					<Typography
						variant="h2-semibold"
						id="webchatHeaderTitle"
						className="webchat-header-title"
						margin={0}
					>
						{title}
					</Typography>
				</div>
				<HeaderIconsWrapper>
					{rest.isDeleteAllConversationsButtonVisible && (
						<HeaderIconButton
							data-header-delete-all-conversations-button
							onClick={onDeleteAllConversations}
							aria-label={
								ariaLabels?.deleteAllConversations ?? "Delete All Conversations"
							}
							className="webchat-header-delete-all-conversations-button"
							iconColor={rest.deleteIconColor}
							tabIndex={0}
							ref={rest.deleteButtonRef}
						>
							<DeleteIcon></DeleteIcon>
						</HeaderIconButton>
					)}
					{
						// Menu Button
						isChatOptionsButtonVisible && (
							<HeaderIconButton
								data-header-menu-button
								onClick={handleMenuClick}
								aria-label={ariaLabels?.chatOptions ?? settings.chatOptions.title}
								ref={menuButtonRef}
							>
								<MenuIcon />
							</HeaderIconButton>
						)
					}
					{
						// Minimize Button
						onMinimize && (
							<HeaderIconButton
								data-header-minimize-button
								onClick={onMinimize}
								className="webchat-header-minimize-button"
								aria-label={ariaLabels?.minimizeChat ?? "Minimize Chat"}
							>
								<MinimizeIcon />
							</HeaderIconButton>
						)
					}
					{
						// Close Button
						onClose && (
							<HeaderIconButton
								data-header-close-button
								onClick={handleCloseClick}
								className="webchat-header-close-button"
								aria-label={ariaLabels?.closeChat ?? "Close Chat"}
								ref={closeButtonRef}
							>
								<CloseIcon />
							</HeaderIconButton>
						)
					}
				</HeaderIconsWrapper>
			</HeaderBar>
			<Notifications />
		</>
	);
};

export default Header;
