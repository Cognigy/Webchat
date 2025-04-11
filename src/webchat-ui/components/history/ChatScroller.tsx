import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import ScrollToBottom, { useScrollToBottom, useSticky } from "react-scroll-to-bottom";
import { IWebchatConfig } from "../../../common/interfaces/webchat-config";
import { useSelector } from "../../../webchat/helper/useSelector";

interface IChatLogWrapperProps extends React.HTMLProps<HTMLDivElement> {
	showFocusOutline?: boolean;
	tabIndex: 0 | -1;
	lastInputId: string;
	scrollBehavior: IWebchatConfig["settings"]["behavior"]["scrollingBehavior"];
}

const ChatLogWrapper = styled.div<IChatLogWrapperProps>(({ theme }) => props => ({
	overflowY: "auto",
	flexGrow: 1,
	minHeight: 0,
	height: theme.blockSize,
	outline: props.showFocusOutline ? `1px auto ${theme.primaryWeakColor}` : "none",
}));

const Scroller = styled(ScrollToBottom)({
	height: "100% !important",
	width: "100%",
	overflowY: "auto" as const,
	position: "initial",

	"& .hiddenAutoScrollButton": {
		display: "none",
	},
});

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
	tabIndex,
	lastInputId,
	scrollBehavior,
	...restProps
}: IChatLogWrapperProps) {
	const innerRef = useRef<HTMLDivElement>(null);
	const outerRef = useRef<HTMLDivElement>(null);

	const [isChatLogFocused, setIsChatLogFocused] = useState(false);
	const [shouldScrollToLastInput, setShouldScrollToLastInput] = useState(false);
	const [scrolledToLastInput, setScrolledToLastInput] = useState(false);

	useEffect(() => {
		if (lastInputId) {
			setShouldScrollToLastInput(true);
			setScrolledToLastInput(false);
		}
	}, [lastInputId]);

	const handleFocus = () => {
		if (innerRef.current === document.activeElement) {
			setIsChatLogFocused(true);
		}
	};

	const handleBlur = () => {
		setIsChatLogFocused(false);
	};

	const scrollerFn = useCallback(
		({ maxValue }) => {
			if (!lastInputId || !scrollBehavior || scrollBehavior === "alwaysScroll")
				return maxValue;

			const targetElement = document.getElementById(lastInputId);
			if (!targetElement || !outerRef.current) return maxValue;

			const containerRect = outerRef.current.getBoundingClientRect();
			const elementRect = targetElement.getBoundingClientRect();
			const elementTopPosition = elementRect.top - containerRect.top;

			// If last input element is near the top (within threshold), stop scrolling
			if (shouldScrollToLastInput && elementTopPosition <= 32) {
				setScrolledToLastInput(true);
				return 0;
			}

			return maxValue;
		},
		[lastInputId, shouldScrollToLastInput, outerRef.current],
	);

	return (
		<ChatLogWrapper ref={outerRef} {...restProps} showFocusOutline={isChatLogFocused}>
			<Scroller followButtonClassName="hiddenAutoScrollButton" scroller={scrollerFn}>
				<ChatLog
					ref={innerRef}
					id="webchatChatHistoryWrapperLiveLogPanel"
					tabIndex={tabIndex}
					role="log"
					aria-live="polite"
					onFocus={handleFocus}
					onBlur={handleBlur}
				>
					<ScrollerContent
						scrolledToLastInput={scrolledToLastInput}
						setShouldScrollToLastInput={setShouldScrollToLastInput}
					>
						{children}
					</ScrollerContent>
				</ChatLog>
			</Scroller>
		</ChatLogWrapper>
	);
}

const ScrollerContent = ({ children, scrolledToLastInput, setShouldScrollToLastInput }) => {
	const scrollToBottom = useScrollToBottom();
	const [sticky] = useSticky();
	const scrollToBottomText = useSelector(
		state => state.config.settings.customTranslations?.ariaLabels?.scrollToBottom,
	);

	const scrollButtonDisabled =
		useSelector(state => state.config.settings.behavior.enableScrollButton) === false;

	useEffect(() => {
		if (sticky && scrolledToLastInput) {
			setShouldScrollToLastInput(false);
		}
	}, [scrolledToLastInput, setShouldScrollToLastInput, sticky]);

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
			{!sticky && !scrollButtonDisabled && (
				<ScrollButton
					className="webchat-scroll-to-bottom-button"
					onClick={scrollToBottom}
					aria-label={scrollToBottomText ?? "Scroll to bottom"}
					style={{ bottom: `${inputHeight + 50}px` }}
				>
					↓
				</ScrollButton>
			)}
		</div>
	);
};
