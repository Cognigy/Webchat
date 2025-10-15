import styled from "@emotion/styled";
import IconButton from "./IconButton";

const FAB = styled(IconButton)(({ theme }) => ({
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	width: 50,
	height: 50,
	backgroundColor: theme.primaryColor,
	backgroundImage: theme.primaryGradient,
	color: theme.primaryContrastColor,
	fill: theme.primaryContrastColor,
	overflow: "visible",
	boxShadow: theme.shadow,
	borderRadius: "50%",
	marginTop: theme.unitSize * 2,

	"&.active, &:hover": {
		backgroundImage: theme.primaryStrongGradient,
		fill: `${theme.primaryContrastColor} !important`,
		color: `${theme.primaryContrastColor} !important`,
	},

	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
		boxShadow: `0 0 0 4px ${theme.white}`,
	},

	// Animation container defaults and keyframes
	"&.burst, &.pulse, &.swing": {
		["--icon-burst-duration" as any]: "0.8s",
		["--icon-bounce-amp" as any]: "10px",
		["--icon-swing-deg" as any]: "12deg",
		["--icon-pulse-scale" as any]: "1.08",
	},

	"&.burst.bounce .iconAnimationContainer.optionActive": {
		animationName: "bounceBurst",
		animationDuration: "var(--icon-burst-duration)",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: 1,
		animationFillMode: "both",
	},
	"&.burst.swing .iconAnimationContainer.optionActive": {
		animationName: "swingBurst",
		animationDuration: "var(--icon-burst-duration)",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: 1,
		animationFillMode: "both",
		transformOrigin: "left bottom",
	},
	"&.burst.pulse .iconAnimationContainer.optionActive": {
		animationName: "pulseBurst",
		animationDuration: "var(--icon-burst-duration)",
		animationTimingFunction: "ease-in-out",
		animationIterationCount: 1,
		animationFillMode: "both",
	},

	"@keyframes bounceBurst": {
		"0%": { transform: "translateY(0)" },
		"30%": { transform: "translateY(calc(-1 * var(--icon-bounce-amp)))" },
		"50%": { transform: "translateY(calc(-0.2 * var(--icon-bounce-amp)))" },
		"70%": { transform: "translateY(calc(-0.6 * var(--icon-bounce-amp)))" },
		"100%": { transform: "translateY(0)" },
	},
	"@keyframes swingBurst": {
		"0%": { transform: "rotate(0deg)" },
		"40%": { transform: "rotate(var(--icon-swing-deg))" },
		"70%": { transform: "rotate(calc(-1 * var(--icon-swing-deg))" },
		"100%": { transform: "rotate(0deg)" },
	},
	"@keyframes pulseBurst": {
		"0%": { transform: "scale(1)", opacity: 1 },
		"50%": { transform: "scale(var(--icon-pulse-scale))", opacity: 0.9 },
		"100%": { transform: "scale(1)", opacity: 1 },
	},
}));

export default FAB;
