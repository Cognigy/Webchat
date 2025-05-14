import React from "react";
import styled from "@emotion/styled";
import Button from "./Button";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";
import Modal from "../Modal/Modal";

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

interface DisconnectOverlayProps {
	isPermanent: boolean;
	onClose: () => void;
	onConnect: () => void;
	config: IWebchatConfig;
}

const DisconnectOverlay = ({ isPermanent, onClose, onConnect, config }: DisconnectOverlayProps) => {
	return (
		<Wrapper>
			<Modal
				dialogStyle={{
					display: "flex",
					flexDirection: "column",
					width: "100%",
					height: "100%",
				}}
				bodyStyle={{
					margin: "auto",
				}}
				isOpen
				onClose={onClose}
				title={config.settings.customTranslations?.network_error ?? "Connection lost"}
			>
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
					<div>
						<div>
							{config.settings.customTranslations?.reconnecting ?? "Reconnecting..."}
						</div>
					</div>
				)}
			</Modal>
		</Wrapper>
	);
};

export default DisconnectOverlay;
