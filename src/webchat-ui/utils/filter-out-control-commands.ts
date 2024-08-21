import { IMessageEvent } from "../../common/interfaces/event";
import { IMessage } from "../../common/interfaces/message";

const EXCLUDE_CC_TYPES = ["acceptPrivacyPolicy", "setRating"];

const getMessagesListWithoutControlCommands = (messages: (IMessage | IMessageEvent)[]) => {
	return messages.filter(message => {
		if (message.data?._cognigy && (message.data._cognigy as any).controlCommands) {
			return !(message.data._cognigy as any).controlCommands.some((controlCommand: any) =>
				EXCLUDE_CC_TYPES.includes(controlCommand.type),
			);
		}
		return true;
	});
};

export default getMessagesListWithoutControlCommands;
