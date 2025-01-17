import React from 'react'
import styled from '@emotion/styled';
import ScrollToBottom, { useScrollToBottom, useSticky } from 'react-scroll-to-bottom';

const CLIENT_HEIGHT_OFFSET = 16 + 70; // banner + typing indicator

export interface OuterProps extends React.HTMLProps<HTMLDivElement> {
	tabIndex: 0 | -1;
	lastInputId: string;
}

type InnerProps = OuterProps;

const ChatLogWrapper = styled(ScrollToBottom)<OuterProps>(({ theme }) => props => ({
	outline: props.showFocusOutline ? `1px auto ${theme.primaryWeakColor}` : "none",
	height: '100%',
	width: '100%',

	"& .hiddenAutoScrollButton": {
		display: 'none',
	},
}));

const ChatLog = styled.div(({ theme }) => ({
	paddingTop: theme.unitSize * 2,
	"&:focus": {
		outline: "none",
	}
}));

const ScrollButton = styled('button')(({ theme }) => ({
	position: 'absolute',
	bottom: '20px',
	left: '50%',
	transform: 'translateX(-50%)',
	backgroundColor: theme.primaryWeakColor,
	color: theme.primaryContrastColor,
	border: 'none',
	borderRadius: '50%',
	width: '30px',
	height: '30px',
	cursor: 'pointer',
	boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
	'&:hover': {
		backgroundColor: theme.primaryStrongColor,
	}
}));

export function ChatScroller({
	children,
	tabIndex,
	lastInputId,
	...restProps
}: InnerProps) {
	const [isChatLogFocused, setIsChatLogFocused] = React.useState(false);
	const innerRef = React.useRef<HTMLDivElement>(null);

	const handleFocus = () => {
		if (innerRef.current === document.activeElement) {
			setIsChatLogFocused(true);
		}
	};

	const handleBlur = () => {
		setIsChatLogFocused(false);
	};

	return (
		<ChatLogWrapper
			showFocusOutline={isChatLogFocused}
			followButtonClassName="hiddenAutoScrollButton"
			{...restProps}
		>
			<ChatLog
				ref={innerRef}
				id="webchatChatHistoryWrapperLiveLogPanel"
				tabIndex={tabIndex}
				role="log"
				aria-live="polite"
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				<ScrollerContent>
					{children}
				</ScrollerContent>
			</ChatLog>
		</ChatLogWrapper>
	);
}

const ScrollerContent = ({
	children
}) => {
	const scrollToBottom = useScrollToBottom();
	const [sticky] = useSticky();

	return (
		<ChatLog>
			{children}
			{!sticky && (
				<ScrollButton
					className="webchat-scroll-to-bottom-button"
					onClick={scrollToBottom}
					aria-label="Scroll to bottom"
				>
					↓
				</ScrollButton>
			)}
		</ChatLog>
	)
}