import React from "react";
import styled from "@emotion/styled";
import PauseIcon from "../../assets/pause-16px.svg";
import PlayIcon from "../../assets/play-16px.svg";

const PauseButton = styled.button(({ theme }) => ({
	// Fixed like the launcher (right 20px / bottom 14px, 50x50 — see
	// embedded-webchat-styles.css) and like the teaser message: a 24x24
	// pointer target (SC 2.5.8) centred on the launcher's bottom-right edge,
	// clear of its 20px icon and of the unread badge (top-right). stylis-rtl
	// mirrors `right` to `left` for RTL pages, matching the launcher's own
	// RTL rule.
	position: "fixed",
	right: 13,
	bottom: 7,
	width: 24,
	height: 24,
	padding: 0,
	margin: 0,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	boxSizing: "border-box",
	cursor: "pointer",
	borderRadius: "50%",
	border: `2px solid ${theme.white}`,
	backgroundColor: theme.primaryColor,
	color: theme.primaryContrastColor,
	boxShadow: theme.shadow,
	// Above the launcher (z-index 1 in the widget root's stacking context)
	zIndex: 2,

	// Fine pointers: hidden until the launcher (its preceding sibling — the
	// sibling rule lives in FAB.tsx) is hovered or keyboard-focused, or the
	// button itself is; it overlaps the launcher's edge, so the pointer can
	// move onto it without a gap. It sits beside the launcher's icon, not
	// over it, so SC 1.4.13 needs no dismiss key. Kept in the DOM and
	// focusable at all times.
	opacity: 0,
	transition: "opacity 150ms ease-in-out",
	"&:hover": {
		opacity: 1,
	},
	"&:focus-visible": {
		opacity: 1,
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
	},
	// No hover on touch devices: always visible (SC 2.2.2 mechanism must be
	// reachable without opening the chat window).
	"@media (hover: none)": {
		opacity: 1,
	},
	// The animation itself is suppressed under reduced motion (FAB.tsx), so
	// there is nothing to pause.
	"@media (prefers-reduced-motion: reduce)": {
		display: "none",
	},

	"& svg": {
		width: 12,
		height: 12,
		display: "block",
	},
}));

interface IconAnimationPauseButtonProps {
	paused: boolean;
	onToggle: () => void;
	/** Name while the animation plays (the button shows a pause icon). */
	pauseLabel: string;
	/** Name while the animation is paused (the button shows a play icon). */
	resumeLabel: string;
}

/**
 * Pause / resume control for the launcher icon animation (WCAG 2.2.2 Pause,
 * Stop, Hide — CGY-39786). Rendered by WebchatUI as the launcher's following
 * sibling, opt-in via `layout.enableIconAnimationPauseButton`. Like the audio player's play/pause button, the
 * accessible name states the action the press will perform and switches
 * together with the icon; no `aria-pressed`, which must not be combined with
 * a changing name (APG button pattern).
 */
const IconAnimationPauseButton: React.FC<IconAnimationPauseButtonProps> = ({
	paused,
	onToggle,
	pauseLabel,
	resumeLabel,
}) => (
	<PauseButton
		type="button"
		className="webchat-toggle-button-animation-pause"
		id="webchatIconAnimationPauseButton"
		aria-label={paused ? resumeLabel : pauseLabel}
		onClick={onToggle}
	>
		{paused ? <PlayIcon aria-hidden /> : <PauseIcon aria-hidden />}
	</PauseButton>
);

export default IconAnimationPauseButton;
