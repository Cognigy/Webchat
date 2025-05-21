import styled from "@emotion/styled";
import React, { InputHTMLAttributes } from "react";

interface FloatingLabelProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	isVisible: boolean;
	inputId: string;
	className?: string;
	disabled?: boolean;
}

const Label = styled.label<{ visible: boolean; disabled?: boolean }>(
	({ theme, visible, disabled }) => ({
		position: "absolute",
		left: 0,
		top: 0,
		color: disabled ? theme.black50 : theme.black10,
		fontSize: 14,
		fontWeight: 400,
		lineHeight: "140%",
		pointerEvents: "none",
		opacity: visible ? 1 : 0,
		visibility: visible ? "visible" : "hidden",
		transition: "opacity 0.15s, visibility 0.15s, color 0.15s",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	}),
);

const FloatingLabel: React.FC<FloatingLabelProps> = props => {
	const { label, isVisible, inputId, className, disabled } = props;

	return (
		<Label htmlFor={inputId} visible={isVisible} disabled={disabled} className={className}>
			{label}
		</Label>
	);
};

export default FloatingLabel;
