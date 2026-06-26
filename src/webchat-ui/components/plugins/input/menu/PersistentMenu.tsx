import React from "react";
import { IPersistentMenuItem } from "../../../../../common/interfaces/webchat-config";
import styled from "@emotion/styled";
import { ActionButtons, Typography } from "@cognigy/chat-components";
import { IWebchatButton } from "@cognigy/socket-client";

interface PersistentMenuProps {
	title: string;
	menuItems: IPersistentMenuItem[];
	onSelect: (item: IPersistentMenuItem) => void;
}

const PersistentMenuContainer = styled.div(({ theme }) => ({
	minHeight: 0,
	flexGrow: 1,
	maxHeight: theme.blockSize * 3,
	overflowY: "auto",
	overscrollBehavior: "contain",
	paddingBottom: theme.unitSize,
	"&:focus": {
		outline: "none",
	},
	marginRight:
		"-20px" /* to compensate for src/webchat-ui/components/plugins/InputPluginRenderer.tsx:42 */,
}));

const ActionButtonsWrapper = styled.div(({ theme }) => ({
	"> div": {
		flexDirection: "column",
	},
	paddingLeft: theme.unitSize,
}));

const PersistentMenu: React.FC<PersistentMenuProps> = ({ title, menuItems, onSelect }) => {
	const buttons: IWebchatButton[] = menuItems.map(item => ({
		title: item.title,
		type: "postback",
		payload: item.payload,
	}));

	return (
		<PersistentMenuContainer className="webchat-input-persistent-menu" tabIndex={-1}>
			<Typography
				id="persistentMenuTitle"
				variant="body-semibold"
				component="h3"
				marginTop={4}
				marginLeft={8}
			>
				{title}
			</Typography>
			<ActionButtonsWrapper aria-labelledby="persistentMenuTitle" role="group">
				<ActionButtons
					buttonClassName="webchat-input-persistent-menu-item"
					containerClassName="webchat-input-persistent-menu-item-container"
					payload={buttons}
					config={{}}
					onEmitAnalytics={() => {}}
					action={text => {
						const item = menuItems.find(i => i.payload === text);
						if (item) {
							onSelect(item);
						}
					}}
				/>
			</ActionButtonsWrapper>
		</PersistentMenuContainer>
	);
};

export default PersistentMenu;
