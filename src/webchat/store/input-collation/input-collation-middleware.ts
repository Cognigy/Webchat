import { Middleware } from "redux";
import { IMessage } from "../../../common/interfaces/message";
import { sendMessage, SendMessageAction } from "../messages/message-middleware";
import { ClearMessagesAction } from "../messages/message-reducer";
import { SwitchSessionAction } from "../previous-conversations/previous-conversations-reducer";
import { StoreState } from "../store";
import { CompleteDeferredSessionSwitchAction } from "../ui/ui-reducer";
import {
	addCollatedMessage,
	submitCollatedMessages,
	SubmitCollatedMessagesAction,
} from "./input-collation-reducer";

type InputCollationMiddlewareAction =
	| SendMessageAction
	| SubmitCollatedMessagesAction
	| SwitchSessionAction
	| CompleteDeferredSessionSwitchAction
	| ClearMessagesAction;

/**
 * creates a middleware which can take care of "input collation" for messages
 * that were flagged with "collate" in their options.
 *
 * Each collated message is shown as its own bubble right away. Only the socket
 * send waits: when the collation timeout ends, the texts are joined and sent as
 * one input, without another bubble.
 *
 * IMPORTANT: this has to be loaded before the "message middleware" because it
 * intercepts actions
 */
export const createInputCollationMiddleware = (): Middleware<object, StoreState> => {
	let collationTimeout: NodeJS.Timeout | null = null;

	return store => {
		const getCollatedMessage = (): IMessage => {
			const { messages } = store.getState().inputCollation;
			const text = messages.map(message => message.text).join(" ");

			/**
			 * Preserve file upload attachments while collating. Each collatable input
			 * carries its attachments in `data.attachments`, so we merge them across all
			 * buffered messages. Without this, uploaded files are silently dropped when
			 * input collation is enabled (no file payload reaches the flow).
			 */
			const attachments = messages.flatMap(message => {
				const fileAttachments = message.data?.attachments;
				return Array.isArray(fileAttachments) ? fileAttachments : [];
			});

			const message = {
				...messages[0],
				text,
				data: attachments.length > 0 ? { attachments } : undefined,
			};

			return message;
		};

		const hasPendingMessages = () => store.getState().inputCollation.messages.length > 0;

		const clearCollationTimeout = () => {
			if (collationTimeout) {
				clearTimeout(collationTimeout);
				collationTimeout = null;
			}
		};

		return next => (action: InputCollationMiddlewareAction) => {
			switch (action.type) {
				case "SEND_MESSAGE": {
					// A "transmit" action is this middleware's own submit of a batch it already took.
					if (action.only === "transmit") break;

					const { enableInputCollation, inputCollationTimeout } =
						store.getState().config.settings.layout;

					/**
					 * In case we're handling a message that's not intended for collation,
					 * we have to send our collated message first and then continue with that message.
					 * This includes messages collated before collation was switched off.
					 * The collated messages are already on screen, so they are only sent.
					 */
					if (!enableInputCollation || !action.options?.collate) {
						if (hasPendingMessages()) {
							clearCollationTimeout();
							next(sendMessage(getCollatedMessage(), {}, "transmit"));
						}
						return next(action);
					}

					clearCollationTimeout();

					/**
					 * Wait for the "collation timeout",
					 * then submit the collated messages
					 */
					collationTimeout = setTimeout(() => {
						store.dispatch(submitCollatedMessages());
					}, inputCollationTimeout);

					next(addCollatedMessage(action.message));

					/**
					 * Show the message now. Its text is sent later, as part of the collated message.
					 */
					return next({ ...action, only: "display" });
				}

				/**
				 * The collated messages are on screen in the conversation being left,
				 * so send them now, while the socket is still on that conversation's session.
				 */
				case "SWITCH_SESSION":
				case "COMPLETE_DEFERRED_SESSION_SWITCH": {
					if (hasPendingMessages()) store.dispatch(submitCollatedMessages());
					break;
				}

				// The collated messages leave the screen with the conversation, so they aren't sent.
				case "CLEAR_MESSAGES": {
					clearCollationTimeout();
					break;
				}

				case "SUBMIT_COLLATED_MESSAGES": {
					/**
					 * clear any additional collation trigger
					 * (in case this was manually triggered)
					 */
					clearCollationTimeout();

					const message = getCollatedMessage();
					next(action);
					store.dispatch(sendMessage(message, {}, "transmit"));

					return;
				}
			}

			return next(action);
		};
	};
};
