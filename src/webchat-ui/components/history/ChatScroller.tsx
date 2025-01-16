import React from 'react'
import styled from '@emotion/styled';

const CLIENT_HEIGHT_OFFSET = 16 + 70; // banner + typing indicator

export interface OuterProps extends React.HTMLProps<HTMLDivElement> {
    showFocusOutline: boolean;
    scrollToPosition: number;
    lastScrolledPosition: number | null;
    setScrollToPosition?: (position: number) => void;
    setLastScrolledPosition?: (position: number | null) => void;
    tabIndex: 0 | -1;
    lastInputId: string;
 }

type InnerProps = OuterProps;

interface IState {
    height: number;
    isChatLogFocused: boolean;
    scrollToLastInput: boolean;
    showScrollButton: boolean;
}

const ChatLogWrapper = styled.div<OuterProps>(({theme}) => props => ({
    outline: props.showFocusOutline ? `1px auto ${theme.primaryWeakColor}` : "none",
}))

const ChatLog = styled.div(({theme}) => ({
    paddingTop: theme.unitSize * 2,
    "&:focus": {
        outline: "none",
    }
}));

const ScrollButton = styled('button')(({ theme }) => ({
    position: 'absolute',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: theme.primaryWeakColor,
    color: theme.primaryContrastColor,
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    '&:hover': {
        backgroundColor: theme.primaryStrongColor,
    }
}));

export class ChatScroller extends React.Component<InnerProps, IState> {
    rootRef: React.RefObject<HTMLDivElement>;
    innerRef: React.RefObject<HTMLDivElement>
    private scrollTimer: NodeJS.Timeout | null = null;

    constructor(props: InnerProps) {
        super(props);

        this.state = {
            height: 0,
            isChatLogFocused: false,
            scrollToLastInput: false,
            showScrollButton: false,
        }

        this.rootRef = React.createRef();
        this.innerRef = React.createRef();
    }

    getSnapshotBeforeUpdate() {
        const root = this.rootRef.current;
        if (!root)
            return false;

        const isScrolledToBottom = root.scrollHeight - root.scrollTop <= root.clientHeight + CLIENT_HEIGHT_OFFSET;

        return isScrolledToBottom
    }

    componentDidUpdate(prevProps: InnerProps, prevState: IState, wasScrolledToBottom: boolean) {
        const {
            setScrollToPosition,
            scrollToPosition,
            lastScrolledPosition,
            setLastScrolledPosition,
            lastInputId,
        } = this.props;

        if (scrollToPosition && setScrollToPosition) {
            // we skip scrollToPosition on first render and re-renders
            if (lastScrolledPosition === null && setLastScrolledPosition) {
                setTimeout(() => { this.handleScrollTo() }, 1000);
                setLastScrolledPosition(0);
            } else if (typeof lastScrolledPosition === "number" && scrollToPosition > lastScrolledPosition) {
                setTimeout(() => { this.handleScrollTo(scrollToPosition) }, 0);
                setLastScrolledPosition && setLastScrolledPosition(scrollToPosition);
            } else if (wasScrolledToBottom) {
                if (!this.state.scrollToLastInput || !this.hasLastInputReachedTop()) {
                    setTimeout(() => { this.handleScrollTo(undefined, true) }, 0);
                }
            }
            setScrollToPosition(0);
        } else if (wasScrolledToBottom) {
            if (!this.state.scrollToLastInput || !this.hasLastInputReachedTop()) {
                setTimeout(() => { this.handleScrollTo(undefined, true) }, 0);
            }
        }

        if (!wasScrolledToBottom && !this.state.showScrollButton) {
            this.setState({ showScrollButton: true });
        }

        if (lastInputId !== prevProps.lastInputId) {
            this.setState({ scrollToLastInput: true });
        }
    }

    componentDidMount() {
        setTimeout(() => { this.handleScrollTo() }, 0);
    }

    componentWillUnmount() {
        const { setLastScrolledPosition } = this.props;
        setLastScrolledPosition && setLastScrolledPosition(null);

        if (this.scrollTimer) {
            clearTimeout(this.scrollTimer);
        }
    }

    handleScrollTo = (position?: number, instant = false) => {
        const root = this.rootRef.current;

        // we need the container reference to perform a scroll on it
        if (!root)
            return;

        const scrollTo = position ? position - 70 : root.scrollHeight - root.clientHeight;

        try {
            root.scroll({
                top: scrollTo,
                behavior: instant ? "instant" : "smooth",
            });
        } catch (e) {
            root.scrollTop = scrollTo;
        }
    }

    // Add outline to the parent element when Chat log receives focus
    handleFocus = () => {
        if (this.innerRef.current === document.activeElement && !this.state.isChatLogFocused) {
            this.setState({isChatLogFocused: true});
        }
    }

    // Remove outline from the parent element when Chat log loses focus 
    handleBlur = () => {
        if (this.state.isChatLogFocused) {
            this.setState({ isChatLogFocused: false })
        }
    }

    scrollToBottom = () => {
        this.setState({
            scrollToLastInput: false,
            showScrollButton: false
        }, () => {
            this.handleScrollTo(undefined);
        });
    }

    private hasLastInputReachedTop(): boolean {
        const { lastInputId } = this.props;
        const root = this.rootRef.current;
        if (!root || !lastInputId) return false;

        const lastInputEl = document.getElementById(lastInputId);
        if (!lastInputEl) return false;

        const containerTop = root.getBoundingClientRect().top;
        const lastInputTop = lastInputEl.getBoundingClientRect().top;

        const distance = lastInputTop - containerTop;

        // 20 as threshold for the distance from the top of the container
        return distance <= 20;
    }

    onScroll = () => {
        const root = this.rootRef.current;
        if (!root) return;

        const isScrolledToBottom = root.scrollHeight - root.scrollTop <= root.clientHeight + CLIENT_HEIGHT_OFFSET;

        if (isScrolledToBottom && this.state.showScrollButton) {
            this.setState({ showScrollButton: false });
        } else if (!isScrolledToBottom && !this.state.showScrollButton) {
            if (this.scrollTimer) {
                clearTimeout(this.scrollTimer);
            }

            this.scrollTimer = setTimeout(() => {
                this.setState({ showScrollButton: true });
            }, 1000);
        }
    }

    onUserInteraction = () => {
        if (this.state.scrollToLastInput === true) {
            this.setState({ scrollToLastInput: false });
        }
    };

    render() {
        const { children, showFocusOutline, tabIndex, lastInputId, ...restProps } = this.props;

        return (
            <ChatLogWrapper
                onScroll={this.onScroll}
                ref={this.rootRef}
                onWheel={this.onUserInteraction}
                onTouchMove={this.onUserInteraction}
                onKeyDown={this.onUserInteraction}
                showFocusOutline={this.state.isChatLogFocused}
                {...restProps}
            >
                {/* Focusable Chat log region*/}
                <ChatLog
                    ref={this.innerRef}
                    id="webchatChatHistoryWrapperLiveLogPanel"
                    tabIndex={tabIndex}
                    role="log"
                    aria-live="polite"
                    onFocus={this.handleFocus}
                    onBlur={this.handleBlur}
                >
                    {children}
                </ChatLog>
                {this.state.showScrollButton && (
                    <ScrollButton
                        className="webchat-scroll-to-bottom-button"
                        onClick={this.scrollToBottom}
                        aria-label="Scroll to bottom"
                    >
                        ↓
                    </ScrollButton>
                )}
            </ChatLogWrapper>
        )
    }
}
