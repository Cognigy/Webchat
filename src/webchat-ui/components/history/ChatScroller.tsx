import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";
import { useSelector } from "../../../webchat/helper/useSelector";
import useIsAtBottom from "./hooks";
import { getAccessiblePrimaryVariant } from "../../style";

interface IChatLogWrapperProps extends React.HTMLProps<HTMLDivElement> {
	showFocusOutline?: boolean;
	lastInputId: string;
	scrollBehavior: IWebchatConfig["settings"]["behavior"]["scrollingBehavior"];
}

const ChatLogWrapper = styled.div<IChatLogWrapperProps>(({ theme }) => props => ({
	overflowY: "auto",
	flexGrow: 1,
	minHeight: 0,
	height: theme.blockSize,
	outline: props.showFocusOutline
		? `1px auto ${getAccessiblePrimaryVariant(theme.primaryColor, theme.white)}`
		: "none",
}));

const ChatLog = styled.div(({ theme }) => ({
	paddingBottom: theme.unitSize * 2,
	"&:focus": {
		outline: "none",
	},
}));

const ScrollButton = styled("button")(({ theme }) => ({
	position: "absolute",
	zIndex: 10,
	bottom: "110px",
	left: "50%",
	transform: "translateX(-50%)",
	backgroundColor: theme.primaryWeakColor,
	color: theme.primaryContrastColor,
	border: "none",
	borderRadius: "50%",
	width: "30px",
	height: "30px",
	cursor: "pointer",
	boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
	"&:hover": {
		backgroundColor: theme.primaryStrongColor,
	},
	"&:focus-visible": {
		outline: `2px solid ${getAccessiblePrimaryVariant(theme.primaryColor, theme.white)}`,
		outlineOffset: 2,
		boxShadow: `0 0 0 4px white`,
	},
}));

/**
 * The ChatScroller component handles the scrolling logic for the chat log.
 * - If scrolled to bottom, it will auto-scroll to bottom if new messages come in (sticky).
 * - It will not scroll to the bottom when the user has scrolled up.
 * - It will only auto-scroll to the bottom until the last user input is at the top.
 * 	This stops once the user scrolled to the bottom again and resets when the next user input comes in.
 * - It will show a scroll button when scrolled up from bottom.
 */
export function ChatScroller({
	children,
	lastInputId,
	scrollBehavior,
	...restProps
}: IChatLogWrapperProps) {
	const innerRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);

	const [isChatLogFocused, setIsChatLogFocused] = useState(false);

	const { isAtBottom, userScrolledUp } = useIsAtBottom(outerRef);

	const handleFocus = () => {
		if (innerRef.current === document.activeElement) {
			setIsChatLogFocused(true);
		}
	};

	const handleBlur = () => {
		setIsChatLogFocused(false);
	};

	// Scroll to last input or scroll to bottom based on scrollBehavior, only if the user has not scrolled up
	useEffect(() => {
		if (!userScrolledUp && outerRef.current) {
			if (scrollBehavior === "alwaysScroll") {
				const scrollOffset = outerRef.current.scrollHeight - outerRef.current.clientHeight;
				handleScroll(scrollOffset);
			} else if (lastInputId) {
				const targetElement = document.getElementById(lastInputId);
				if (targetElement) {
					const scrollOffset = targetElement.offsetTop - outerRef.current.offsetTop;
					handleScroll(scrollOffset);
				}
			}
		}
	}, [children, scrollBehavior, lastInputId]);

	// Handle scrolling to a specific position
	const handleScroll = (top: number) => {
		if (outerRef.current) {
			outerRef.current.scrollTo({ top, behavior: "smooth" });
		}
	};

	// Handle scrolling to the bottom when the scroll button is clicked
	const handleScrollToBottom = () => {
		if (outerRef.current) {
			const scrollOffset = outerRef.current?.scrollHeight - outerRef.current?.clientHeight;
			handleScroll(scrollOffset);
		}
	};

	// Find if the chat log is overflowing to allow for focus (for keyboard users to scroll)
	const isChatLogOverflowing = () => {
		if (!outerRef.current || !innerRef.current) return false;
		const outerHeight = outerRef.current.clientHeight;
		const innerHeight = innerRef.current.scrollHeight;
		return innerHeight > outerHeight;
	};

	return (
		<ChatLogWrapper ref={outerRef} {...restProps} showFocusOutline={isChatLogFocused}>
			<ChatLog
				ref={innerRef}
				id="webchatChatHistoryWrapperLiveLogPanel"
				tabIndex={isChatLogOverflowing() ? 0 : -1}
				aria-labelledby="webchatChatHistoryHeading"
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				<ScrollerContent isAtBottom={isAtBottom} onScrollToBottom={handleScrollToBottom}>
					{children}
				</ScrollerContent>
			</ChatLog>
		</ChatLogWrapper>
	);
}

const ScrollerContent = ({ children, isAtBottom, onScrollToBottom }) => {
	const scrollToBottomText = useSelector(
		state => state.config.settings.customTranslations?.ariaLabels?.scrollToBottom,
	);

	const scrollButtonDisabled =
		useSelector(state => state.config.settings.behavior.enableScrollButton) === false;

	const [inputHeight, setInputHeight] = useState(0);

	useEffect(() => {
		const observeElement = element => {
			const resizeObserver = new ResizeObserver(entries => {
				for (const entry of entries) {
					setInputHeight(entry.contentRect.height);
				}
			});
			resizeObserver.observe(element);

			return () => resizeObserver.disconnect();
		};

		const mutationObserver = new MutationObserver(() => {
			const inputElement = document.querySelector(".webchat-input");
			if (inputElement) {
				observeElement(inputElement);
				mutationObserver.disconnect();
			}
		});

		mutationObserver.observe(document.body, { childList: true, subtree: true });

		return () => mutationObserver.disconnect();
	}, []);

	return (
		<div>
			{children}
			{!isAtBottom && !scrollButtonDisabled && (
				<ScrollButton
					className="webchat-scroll-to-bottom-button"
					onClick={onScrollToBottom}
					aria-label={scrollToBottomText ?? "Scroll to the bottom of the chat"}
					style={{ bottom: `${inputHeight + 50}px` }}
				>
					↓
				</ScrollButton>
			)}
		</div>
	);
};
