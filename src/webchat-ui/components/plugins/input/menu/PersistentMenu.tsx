import React from "react";
import { IPersistentMenuItem } from "../../../../../common/interfaces/webchat-config";
import styled from "@emotion/styled";
import { ActionButtons } from "@cognigy/chat-components";
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

const PersistentMenuTitle = styled.h5(({ theme }) => ({
	color: "hsla(0, 0%, 0%, .3)",
	padding: `0 ${theme.unitSize}px ${theme.unitSize}px`,
	margin: 0,
}));

const PersistentMenu: React.FC<PersistentMenuProps> = ({ title, menuItems, onSelect }) => {
	const menuRef = React.useRef<HTMLDivElement>(null);

	const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
		const { key, target } = e;
		let newFocusTarget: HTMLButtonElement | null = null;

		if (!menuRef.current) return;

		switch (key) {
			case "ArrowUp":
				newFocusTarget =
					// @ts-expect-error Missing type for previousElementSibling in React Types
					((target.previousElementSibling as HTMLButtonElement) ||
						menuRef.current.lastChild) as HTMLButtonElement;
				break;
			case "ArrowDown":
				newFocusTarget = (target.nextElementSibling ||
					menuRef.current.firstChild) as HTMLButtonElement;
				break;
			case "Home":
				newFocusTarget = menuRef.current.firstChild as HTMLButtonElement;
				break;
			case "End":
				newFocusTarget = menuRef.current.lastChild as HTMLButtonElement;
				break;
			default:
				break;
		}

		if (newFocusTarget !== null) {
			newFocusTarget.focus();
			e.preventDefault();
		}
	};

	const buttons: IWebchatButton[] = menuItems.map(item => ({
		title: item.title,
		type: "postback",
		payload: item.payload,
	}));

	return (
		<PersistentMenuContainer className="webchat-input-persistent-menu" tabIndex={-1}>
			<PersistentMenuTitle>{title}</PersistentMenuTitle>
			<ActionButtonsWrapper
				aria-labelledby="persistentMenuTitle"
				role="menu"
				ref={menuRef}
				onKeyDown={handleMenuKeyDown}
			>
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
