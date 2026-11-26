import React, { useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import CloseIcon from "../../../assets/close-10px.svg";
import CollapseIcon from "../../../assets/collapse-20px.svg";
import { ConversationsSortOrder } from "./helpers";

const SORT_OPTIONS: { value: ConversationsSortOrder; label: string }[] = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
];

const Toolbar = styled.div({
	display: "flex",
	alignItems: "center",
	gap: 8,
	padding: "16px 20px 0 20px",
	fontWeight: 400,
});

const SearchField = styled.div({
	position: "relative",
	display: "flex",
	alignItems: "center",
	flexGrow: 1,
});

const SearchInput = styled.input(({ theme }) => ({
	width: "100%",
	height: 40,
	padding: "0 36px 0 12px",
	border: `1px solid ${theme.black50}`,
	borderRadius: 10,
	backgroundColor: theme.white,
	color: theme.black10,
	fontFamily: "inherit",
	fontSize: 14,
	"&::placeholder": {
		color: theme.black60,
	},
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
	},
}));

const ClearSearch = styled.div(({ theme }) => ({
	position: "absolute",
	right: 10,
	width: 16,
	height: 16,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	cursor: "pointer",
	"& svg": {
		width: 10,
		height: 10,
		fill: theme.black40,
	},
}));

const SortWrapper = styled.div({
	position: "relative",
	flexShrink: 0,
});

const SortButton = styled.button(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: 4,
	height: 40,
	padding: "0 12px",
	border: `1px solid ${theme.black50}`,
	borderRadius: 10,
	backgroundColor: theme.white,
	color: theme.black10,
	fontFamily: "inherit",
	fontSize: 14,
	cursor: "pointer",
	outline: "none",
	"&:hover": {
		backgroundColor: theme.black95,
	},
	"& svg": {
		width: 16,
		height: 16,
		fill: theme.black10,
	},
}));

const slideDown = keyframes({
	from: { opacity: 0, transform: "translateY(-8px)" },
	to: { opacity: 1, transform: "translateY(0)" },
});

const SortMenu = styled.div(({ theme }) => ({
	position: "absolute",
	top: 44,
	right: 0,
	zIndex: 2,
	minWidth: 160,
	padding: 4,
	border: `1px solid ${theme.black80}`,
	borderRadius: 10,
	backgroundColor: theme.white,
	boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
	animation: `${slideDown} 250ms ease-out`,
}));

const SortOption = styled.div<{ isSelected: boolean }>(({ theme, isSelected }) => ({
	padding: "8px 12px",
	borderRadius: 6,
	fontSize: 14,
	color: isSelected ? theme.primaryColor : theme.black10,
	cursor: "pointer",
	"&:hover": {
		backgroundColor: theme.black95,
	},
}));

interface IConversationsToolbarProps {
	query: string;
	sortOrder: ConversationsSortOrder;
	onQueryChange: (query: string) => void;
	onSortOrderChange: (sortOrder: ConversationsSortOrder) => void;
}

export const ConversationsToolbar = (props: IConversationsToolbarProps) => {
	const { query, sortOrder, onQueryChange, onSortOrderChange } = props;

	const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

	const handleSelectSortOrder = (value: ConversationsSortOrder) => {
		onSortOrderChange(value);
		setIsSortMenuOpen(false);
	};

	return (
		<Toolbar className="webchat-prev-conversations-toolbar" role="search">
			<SearchField>
				<SearchInput
					className="webchat-prev-conversations-search-input"
					type="search"
					placeholder="Search conversations"
					value={query}
					onChange={e => onQueryChange(e.target.value)}
				/>
				{query && (
					<ClearSearch
						className="webchat-prev-conversations-search-clear"
						onClick={() => onQueryChange("")}
					>
						<CloseIcon />
					</ClearSearch>
				)}
			</SearchField>
			<SortWrapper>
				<SortButton
					type="button"
					className="webchat-prev-conversations-sort-button"
					aria-label="Sort conversations"
					onClick={() => setIsSortMenuOpen(isOpen => !isOpen)}
				>
					Sort
					<CollapseIcon aria-hidden="true" />
				</SortButton>
				{isSortMenuOpen && (
					<SortMenu className="webchat-prev-conversations-sort-menu">
						{SORT_OPTIONS.map(option => (
							<SortOption
								key={option.value}
								className="webchat-prev-conversations-sort-option"
								isSelected={option.value === sortOrder}
								onClick={() => handleSelectSortOrder(option.value)}
							>
								{option.label}
							</SortOption>
						))}
					</SortMenu>
				)}
			</SortWrapper>
		</Toolbar>
	);
};
