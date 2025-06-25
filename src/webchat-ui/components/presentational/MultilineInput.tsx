import React, { ComponentProps, forwardRef } from "react";
import styled from "@emotion/styled";
import MediaQuery from "react-responsive";
import FloatingLabel from "../plugins/input/base/FloatingLabel";

const InputWrapper = styled.div<{ disabled?: boolean }>(({ theme, disabled }) => ({
	borderRadius: 10,
	border: `1px solid var(--basics-black-60, ${theme.black60})`,
	background: `var(--Basics-white, ${theme.white})`,
	width: "100%",
	padding: 12,
	"&:focus-within": {
		borderColor: "transparent",
		outline: `2px solid ${theme.primaryColor}`,
	},
	borderColor: disabled ? theme.black80 : theme.black60,
}));

const Input = styled.textarea(({ theme }) => ({
	padding: "0 12px 0 0",
	width: "100%",
	height: "100%",
	border: "none",
	resize: "none",

	color: theme.black10,
	fontFamily: "Figtree",
	fontSize: "0.875rem", // 14px
	fontWeight: 400,
	lineHeight: "140%",

	"&:focus": {
		outline: "none",
	},

	"&:disabled": {
		color: theme.black60,
	},

	"::-webkit-scrollbar": {
		width: 2,
		height: 2,
	},
	"::-webkit-scrollbar-track": {
		backgroundColor: theme.black95,
	},
	"::-webkit-scrollbar-thumb": {
		backgroundColor: theme.black60,
	},
}));

const InputContainer = styled.div({
	position: "relative",
	display: "flex",
	flexDirection: "column",
	flexGrow: 1,
});

interface IMultilineInputProps extends ComponentProps<typeof Input> {
	className?: string;
	placeholder?: string;
	dataTest?: string;
	label: string;
	isVisible: boolean;
	inputId: string;
}

const MultilineInput = forwardRef<HTMLTextAreaElement, IMultilineInputProps>((props, ref) => {
	const { className, dataTest, label, isVisible, inputId, ...restProps } = props;
	const { disabled } = props;

	return (
		<InputWrapper disabled={disabled}>
			<MediaQuery maxWidth={575}>
				{matches => (
					<InputContainer className={`${className}-container`}>
						<FloatingLabel
							inputId={inputId}
							isVisible={isVisible}
							label={label}
							className={`${className}-label`}
							disabled={disabled}
						/>
						<Input
							{...restProps}
							id={inputId}
							data-test={dataTest}
							ref={ref}
							className={`${className} ${disabled ? "disabled" : ""}`.trim()}
							style={matches ? { fontSize: "16px" } : undefined}
						/>
					</InputContainer>
				)}
			</MediaQuery>
		</InputWrapper>
	);
});

MultilineInput.displayName = "MultilineInput";

export default MultilineInput;
