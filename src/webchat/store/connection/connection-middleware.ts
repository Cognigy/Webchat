import { Middleware } from "redux";
import { StoreState } from "../store";
import {
	SetHasAcceptedTermsAction,
	SetPageVisibleAction,
	ShowChatScreenAction,
	ToggleOpenAction,
	setStoredMessage,
} from "../ui/ui-reducer";
import { SendMessageAction, sendMessage } from "../messages/message-middleware";
import { setOptions } from "../options/options-reducer";
import { SocketClient } from "@cognigy/socket-client";
import { connect, ConnectAction, setConnecting, setReconnectionLimit } from "./connection-reducer";
import { shouldReestablishConnection } from "../../helper/connection-watchdog";

export interface ISendMessageOptions {
	/* overrides the displayed text within a chat bubble. useful for e.g. buttons */
	label: string;
}

const DISCONNECT = "DISCONNECT" as const;
export const disconnect = () => ({
	type: DISCONNECT,
});
export type DisConnectAction = ReturnType<typeof disconnect>;

const NETWORK_ON = "NETWORK_ON";
export const announceNetworkOn = () => ({ type: NETWORK_ON as "NETWORK_ON" });
type announceNetworkOnAction = ReturnType<typeof announceNetworkOn>;

// forwards messages to the socket
export const createConnectionMiddleware =
	(client: SocketClient): Middleware<object, StoreState> =>
	store =>
	next =>
	(
		action:
			| ToggleOpenAction
			| ConnectAction
			| SetHasAcceptedTermsAction
			| SendMessageAction
			| ShowChatScreenAction
			| SetPageVisibleAction
			| announceNetworkOnAction
			| DisConnectAction,
	) => {
		switch (action.type) {
			case "CONNECT": {
				const { storedMessage } = store.getState().ui;

				if (!client.connected && !store.getState().connection.connecting) {
					store.dispatch(setConnecting(true));

					client
						.connect()
						.then(() => {
							store.dispatch(setReconnectionLimit(false));

							if (storedMessage) {
								store.dispatch(
									sendMessage(
										{ text: storedMessage.text, data: storedMessage.data },
										storedMessage.options,
									),
								);
								store.dispatch(setStoredMessage(null));
							}
							// set options — `options-middleware` restores a
							// persisted conversation while handling this.
							store.dispatch(setOptions(client.socketOptions));
							// Last: `connecting` turning false is what tells
							// the UI the connect has settled and its session
							// id (and any restore) are known — the AI-agent
							// notice waits for exactly that (CGY-3519).
							// Dispatching it after the restore keeps that
							// true without relying on React batching these
							// updates into one commit.
							store.dispatch(setConnecting(false));
						})
						.catch(() => {
							store.dispatch(setConnecting(false));
						});
				}
				break;
			}

			case "SHOW_CHAT_SCREEN": {
				if (!client.connected) {
					store.dispatch(connect());
				}

				break;
			}

			case "SEND_MESSAGE": {
				store.dispatch(connect());

				break;
			}

			case "SET_PAGE_VISIBLE": {
				if (action.visible && shouldReestablishConnection(store.getState())) {
					store.dispatch(connect());
				}

				break;
			}
			case DISCONNECT: {
				client.disconnect();
				break;
			}

			case "NETWORK_ON": {
				if (shouldReestablishConnection(store.getState())) {
					store.dispatch(connect());
				}

				break;
			}
		}

		return next(action);
	};
