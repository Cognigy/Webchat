import React from "react";
import styled from "@emotion/styled";
import classNames from "classnames";

interface IToggleButtonProps {
	onClick: () => void;
	isActive: boolean;
	disabled?: boolean;
	className?: string;
	"aria-labelledby"?: string;
}

type IToggleStyleProps = Pick<IToggleButtonProps, "isActive" | "disabled">;

const StyledToggleButtonOuter = styled.button<IToggleStyleProps>(
	({ theme, isActive, disabled }) => ({
		display: "flex",
		alignItems: "center",
		padding: 1,
		width: 30,
		height: 16,
		borderRadius: 15,
		// black50 (#808080) keeps the track boundary ≥ 3:1 on white (WCAG 1.4.11) — black80 was ~1.6:1
		border: `1px solid ${theme.black50}`,
		backgroundColor: theme.white,
		cursor: disabled ? "default" : "pointer",
		transition: "background-color 0.2s ease-in-out",

		// Invisible hit-area extension so the pointer target is ≥ 24x24px (WCAG 2.2 SC 2.5.8)
		position: "relative",
		"&::before": {
			content: '""',
			position: "absolute",
			top: -5,
			bottom: -5,
			left: 0,
			right: 0,
		},

		"&:focus-visible": {
			outline: `2px solid ${theme.primaryColorFocus}`,
			outlineOffset: 2,
		},

		"@media (prefers-reduced-motion: reduce)": {
			transition: "none",
		},

		"&.active": {
			backgroundColor: disabled ? theme.secondaryColorDisabled : theme.secondaryColor,

			"&:hover": {
				backgroundColor: disabled
					? theme.secondaryColorDisabled
					: theme.secondaryColorHover,
			},
		},
	}),
);

const StyledToggleButtonInner = styled.div<IToggleStyleProps>(({ theme, isActive, disabled }) => ({
	width: 12,
	height: 12,
	borderRadius: 12,
	backgroundColor: disabled ? theme.secondaryColorDisabled : theme.secondaryColor,
	cursor: disabled ? "default" : "pointer",
	transform: isActive ? "translateX(14px)" : "translateX(0px)",
	transition: "transform 0.2s ease-in-out, background-color 0.2s ease-in-out",

	"@media (prefers-reduced-motion: reduce)": {
		transition: "none",
	},

	"&:hover": {
		backgroundColor: disabled ? theme.secondaryColorDisabled : theme.secondaryColorHover,
	},
	"&.hovered": {
		backgroundColor: disabled ? theme.secondaryColorDisabled : theme.secondaryColorHover,
	},

	"&.active": {
		backgroundColor: theme.white,
	},
}));

export const ToggleButton = (props: IToggleButtonProps) => {
	const { onClick, isActive, className, disabled, "aria-labelledby": ariaLabelledBy } = props;

	const [isHovered, setIsHovered] = React.useState(false);

	return (
		<StyledToggleButtonOuter
			type="button"
			className={classNames(className, "webchat-toggle-button-root", isActive && "active")}
			onClick={onClick}
			isActive={isActive}
			disabled={disabled}
			role="switch"
			aria-checked={Boolean(isActive)}
			aria-labelledby={ariaLabelledBy}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<StyledToggleButtonInner
				className={classNames(
					"webchat-toggle-button-inner-circle",
					isActive && "active",
					isHovered && "hovered",
				)}
				isActive={isActive}
				disabled={disabled}
			/>
		</StyledToggleButtonOuter>
	);
};
