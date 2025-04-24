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
 }

type InnerProps = OuterProps;

interface IState {
    height: number;
    isChatLogFocused: boolean;
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

export class ChatScroller extends React.Component<InnerProps, IState> {
    rootRef: React.RefObject<HTMLDivElement>;
    innerRef: React.RefObject<HTMLDivElement>

    constructor(props: InnerProps) {
        super(props);

        this.state = {
            height: 0,
            isChatLogFocused: false
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
        const { setScrollToPosition, scrollToPosition, lastScrolledPosition, setLastScrolledPosition } = this.props;
        if (scrollToPosition && setScrollToPosition) {
            // we skip scrollToPosition on first render and re-renders
            if (lastScrolledPosition === null && setLastScrolledPosition) {
                setTimeout(() => { this.handleScrollTo() }, 1000);
                setLastScrolledPosition(0);
            } else if (typeof lastScrolledPosition === "number" && scrollToPosition > lastScrolledPosition) {
                setTimeout(() => { this.handleScrollTo(scrollToPosition) }, 0);
                setLastScrolledPosition && setLastScrolledPosition(scrollToPosition);
            } else if (wasScrolledToBottom) {
                setTimeout(() => { this.handleScrollTo() }, 0);
            }
            setScrollToPosition(0);
        } else if (wasScrolledToBottom) {
            setTimeout(() => { this.handleScrollTo(undefined, true) }, 0);
        }  
    }

    componentDidMount() {
        setTimeout(() => { this.handleScrollTo() }, 0);
    }

    componentWillUnmount() {
        const { setLastScrolledPosition } = this.props;
        setLastScrolledPosition && setLastScrolledPosition(null);
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
        if(this.innerRef.current === document.activeElement) {
            this.setState({isChatLogFocused: true});
        }
    }

    // Remove outline from the parent element when Chat log loses focus 
    handleBlur = () => {
        this.setState({isChatLogFocused: false})
    }

    render() {
		const { children, showFocusOutline, tabIndex, ...restProps } = this.props;

        return (
            <ChatLogWrapper ref={this.rootRef} showFocusOutline={this.state.isChatLogFocused} {...restProps}>
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
            </ChatLogWrapper>
        )
    }
}
