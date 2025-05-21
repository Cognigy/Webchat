import React from "react";
import styled from "@emotion/styled";
import ReactModal from "react-modal";

import Button from "./Button";
import IconButton from "./IconButton";
import CloseIcon from "../../assets/baseline-close-24px.svg";

import { IWebchatConfig } from "../../../common/interfaces/webchat-config";

const Title = styled.h2(({ theme }) => ({
	fontSize: "1.5rem",
	marginBlockStart: "-.25rem",
	fontWeight: 600,
	boxSizing: "border-box",
	zIndex: 4,
}));

const HeaderIconButton = styled(IconButton)(({ theme }) => ({
	position: "absolute",
	right: 15,
	top: 17,
	borderRadius: 4,
	"&:focus": {
		outline: `2px solid ${theme.primaryColor}`,
		outlineOffset: 2,
	},
}));

interface DisconnectOverlayProps {
	isOpen: boolean;
	isPermanent: boolean;
	onClose: () => void;
	onConnect: () => void;
	config: IWebchatConfig;
}

const DisconnectOverlay = (props: DisconnectOverlayProps) => {
	const { isPermanent, onClose, onConnect, config, isOpen } = props;

	const parentSelector = () => document.querySelector("#webchatWindow");

	return (
		<ReactModal
			isOpen={isOpen}
			parentSelector={parentSelector}
			onClose={onClose}
			style={{
				overlay: {
					position: "absolute",
					zIndex: 3,
				},
				content: {
					inset: 50,
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					margin: "auto",
					justifyContent: "center",
				},
			}}
		>
			<HeaderIconButton
				autoFocus={!isPermanent} // Focus only if the reconnect button is not rendered
				data-disconnect-overlay-close-button
				onClick={onClose}
				className="webchat-header-close-button"
				aria-label={
					config.settings.customTranslations?.ariaLabels?.closeConnectionWarning ??
					"Close connection lost overlay"
				}
			>
				<CloseIcon style={{ fill: "#000" }} />
			</HeaderIconButton>
			<Title>{config.settings.customTranslations?.network_error ?? "Connection lost"}</Title>
			{isPermanent ? (
				<>
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
				<div>{config.settings.customTranslations?.reconnecting ?? "Reconnecting..."}</div>
			)}
		</ReactModal>
	);
};

export default DisconnectOverlay;
