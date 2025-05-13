import React, { useCallback } from "react";
import styled from "@emotion/styled";
import IconButton from "./IconButton";
import CloseIcon from "../../assets/baseline-close-24px.svg";
import Button from "./Button";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";

const Wrapper = styled.div(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",

	position: "absolute",
	left: 0,
	top: 0,
	width: "100%",
	height: "100%",

	padding: 20,
	boxSizing: "border-box",
	backgroundColor: theme.white,
	zIndex: 4,
}));

const Dialog = styled.div(({ theme }) => ({
	padding: theme.unitSize * 2,
	borderRadius: theme.unitSize,

	textAlign: "center",
}));

const DialogHeader = styled.div(({ theme }) => ({
	marginBottom: theme.unitSize * 2,
	fontSize: 22,
	fontWeight: 600,
}));

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	right: 20,
	top: 20,
	padding: 0,

	color: theme.textDark,
	fill: theme.textDark,
	borderRadius: "50%",
}));

interface DisconnectOverlayProps {
	isPermanent: boolean;
	onClose: () => void;
	onConnect: () => void;
	config: IWebchatConfig;
}

const DisconnectOverlay = ({ isPermanent, onClose, onConnect, config }: DisconnectOverlayProps) => {
	const ref = useCallback(ref => ref?.focus?.(), []);
	return (
		<Wrapper>
			<Dialog ref={ref}>
				{isPermanent ? (
					<>
						<DialogHeader>
							{config.settings.customTranslations?.network_error ?? "Connection lost"}
						</DialogHeader>
						{navigator.onLine ? (
							<Button
								autoFocus
								onClick={onConnect}
								color="primary"
								style={{ margin: "auto" }}
							>
								{config.settings.customTranslations?.reconnect ?? "Reconnect"}
							</Button>
						) : (
							<div>
								{config.settings.customTranslations?.no_network ??
									"No network connection"}
							</div>
						)}
					</>
				) : (
					<div>
						<DialogHeader>
							{config.settings.customTranslations?.network_error ?? "Connection lost"}
						</DialogHeader>
						<div>
							{config.settings.customTranslations?.reconnecting ?? "Reconnecting..."}
						</div>
					</div>
				)}
			</Dialog>
			<HeaderIconButton
				data-disconnect-overlay-close-button
				onClick={onClose}
				className="webchat-header-close-button"
				aria-label={
					config.settings.customTranslations?.ariaLabels?.closeConnectionWarning ??
					"Close connection lost overlay"
				}
			>
				<CloseIcon />
			</HeaderIconButton>
		</Wrapper>
	);
};

export default DisconnectOverlay;
