import React from "react";
import styled from "@emotion/styled";
import IconButton from "./IconButton";
import CloseIcon from "../../assets/baseline-close-24px.svg";
import Button from "./Button";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";

const Wrapper = styled.div(({ theme }) => ({
	"@keyframes appearAnimation": {
		from: {
			opacity: 0,
			transform: "scale(.95)",
			translateZ: -2,
		},
		to: {
			opacity: 0.93,
			transform: "scale(1)",
			translateZ: -2,
		},
	},

	animation: "appearAnimation 0.33s 0.75s both",
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
	backgroundColor: `color-mix(in srgb, ${theme.white}, #0001)`,
	backdropFilter: "blur(18px)",
	opacity: 0,
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
	right: 15,
	top: 17,

	color: theme.textLight,
	fill: theme.textLight,
	borderRadius: "50%",
}));

interface DisconnectOverlayProps {
	isPermanent: boolean;
	onClose: () => void;
	onConnect: () => void;
	config: IWebchatConfig;
}

const DisconnectOverlay = ({ isPermanent, onClose, onConnect, config }: DisconnectOverlayProps) => {
	return (
		<Wrapper>
			<Dialog>
				{isPermanent ? (
					<>
						<DialogHeader>{config.settings.customTranslations?.network_error ?? "Connection lost"}</DialogHeader>
						{navigator.onLine ? (
							<Button onClick={onConnect} color="primary" style={{ margin: "auto" }}>
								{config.settings.customTranslations?.reconnect ?? "Reconnect"}
							</Button>
						) : (
								<div>{config.settings.customTranslations?.no_network ?? "No network connection"}</div>
							)}
					</>
				) : (
						<div>
							<DialogHeader>{config.settings.customTranslations?.network_error ?? "Connection lost"}</DialogHeader>
							<div>{config.settings.customTranslations?.reconnecting ?? "Reconnecting..."}</div>
						</div>
					)}
			</Dialog>
			<HeaderIconButton
				data-disconnect-overlay-close-button
				onClick={onClose}
				className="webchat-header-close-button"
				aria-label="Close Warning"
			>
				<CloseIcon />
			</HeaderIconButton>
		</Wrapper>
	);
};

export default DisconnectOverlay;
