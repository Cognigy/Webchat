import React from "react";
import { InputComponentProps } from "../../common/interfaces/input-plugin";
import Toolbar from "../../webchat-ui/components/presentational/Toolbar";
import Button from "../../webchat-ui/components/presentational/Button";
import styled from "@emotion/styled";

const GetStartedButton = styled(Button)(({ theme }) => ({
	marginBottom: theme.unitSize * 2,
	flexGrow: 1,
}));

const GetStartedInput = ({ onSendMessage, config }: InputComponentProps) => (
	<Toolbar>
		<GetStartedButton
			onClick={() =>
				onSendMessage(
					config.settings.startBehavior.getStartedPayload,
					config.settings.startBehavior.getStartedData,
					{ label: config.settings.startBehavior.getStartedText ?? "" },
				)
			}
			color="primary"
			id="webchatGetStartedButton"
			className="webchat-input-get-started-button"
			// Intentional: this button is the sole call-to-action in the input area;
			// focusing it lets keyboard users start the conversation immediately.
			// eslint-disable-next-line jsx-a11y/no-autofocus
			autoFocus
		>
			{config.settings.startBehavior.getStartedButtonText}
		</GetStartedButton>
	</Toolbar>
);

export default GetStartedInput;
