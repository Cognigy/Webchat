import React from "react";
import { IPersistentMenuItem } from "../../../../../common/interfaces/webchat-config";
import styled from "@emotion/styled";

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
}));

const PersistentMenuTitle = styled.h5(({ theme }) => ({
	color: "hsla(0, 0%, 0%, .3)",
	padding: `0 ${theme.unitSize * 2}px ${theme.unitSize}px`,
	margin: 0,
}));

const PersistentMenuItem = styled.button(({ theme }) => ({
	display: "block",
	position: "relative",
	backgroundColor: "transparent",
	outline: "none",
	cursor: "pointer",
	textAlign: "left",
	color: "hsla(0, 0%, 0%, .87)",

	padding: `${theme.unitSize}px ${theme.unitSize * 3}px`,
	margin: theme.unitSize,
	borderRadius: theme.unitSize * 2,
	borderStyle: "solid",
	borderColor: "hsla(0, 0%, 0%, .12)",
	borderWidth: 1,

	"&:hover": {
		backgroundColor: "hsla(0, 0%, 0%, .08)",
	},

	"&:active": {
		backgroundColor: "hsla(0, 0%, 0%, .12)",
	},

	"&:focus": {
		outline: `2px solid ${theme.primaryColor}`,
	},
}));

const PersistentMenu: React.FC<PersistentMenuProps> = ({ title, menuItems, onSelect }) => {
	const handleMenuItem = (item: IPersistentMenuItem) => {
		onSelect(item);
	};

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
	return (
		<PersistentMenuContainer className="webchat-input-persistent-menu" tabIndex={-1}>
			<PersistentMenuTitle>{title}</PersistentMenuTitle>
			<div
				aria-labelledby="persistentMenuTitle"
				role="menu"
				ref={menuRef}
				onKeyDown={handleMenuKeyDown}
			>
				{menuItems.map((item, index) => (
					<PersistentMenuItem
						key={`${item.title}${item.payload}`}
						onClick={() => handleMenuItem(item)}
						className="webchat-input-persistent-menu-item"
						role="menuitem"
						autoFocus={index === 0}
						tabIndex={index === 0 ? 0 : -1}
					>
						{item.title}
					</PersistentMenuItem>
				))}
			</div>
		</PersistentMenuContainer>
	);
};

export default PersistentMenu;
