import GetStartedInput from "./GetStartedInput";
import { InputRule, InputPlugin } from "../../common/interfaces/input-plugin";
import { registerInputPlugin } from "../helper";
import getMessagesListWithoutControlCommands from "../../webchat-ui/utils/filter-out-control-commands";

const rule: InputRule = ({
	config: {
		settings: {
			startBehavior: {
				startBehavior,
				getStartedButtonText,
				getStartedData,
				getStartedPayload,
				getStartedText,
			},
		},
	},
	messages,
}) =>
	(messages.length === 0 ||
		(messages.length === 1 && messages[0].source === "engagement") ||
		getMessagesListWithoutControlCommands(messages)?.length === 0) &&
	startBehavior === "button" &&
	!!getStartedPayload &&
	(!!getStartedButtonText ||
		!!getStartedText ||
		(!!getStartedData &&
			typeof getStartedData === "object" &&
			Object.keys(getStartedData).length > 0));

const getStartedInputPlugin: InputPlugin = {
	type: "rule",
	rule,
	component: GetStartedInput,
};

registerInputPlugin(getStartedInputPlugin);

export default getStartedInputPlugin;
