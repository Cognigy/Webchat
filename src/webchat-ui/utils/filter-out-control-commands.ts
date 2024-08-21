import { IMessageEvent } from "../../common/interfaces/event";
import { IMessage } from "../../common/interfaces/message";

const getMessagesListWithoutControlCommands = (messages: (IMessage | IMessageEvent)[], types: string[]) => {
	return messages.filter(message => {
		if (message.data?._cognigy && (message.data._cognigy as any).controlCommands) {
			return !(message.data._cognigy as any).controlCommands.some((controlCommand: any) =>
				types.includes(controlCommand.type),
			);
		}
		return true;
	});
};

export default getMessagesListWithoutControlCommands;
