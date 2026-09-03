import { Reducer } from "redux";
import type { SwitchSessionAction } from "../previous-conversations/previous-conversations-reducer";

export interface ConnectionState {
	connected: boolean;
	connecting: boolean;
	reconnectionLimit: boolean;
	hasAttemptedConnection: boolean;
}

const initialState: ConnectionState = {
	connected: false,
	connecting: false,
	reconnectionLimit: false,
	hasAttemptedConnection: false,
};

export const CONNECT = "CONNECT";
export const connect = () => ({
	type: CONNECT as "CONNECT",
});
export type ConnectAction = ReturnType<typeof connect>;

export const SET_CONNECTING = "SET_CONNECTING";
export const setConnecting = (connecting: boolean) => ({
	type: SET_CONNECTING as "SET_CONNECTING",
	connecting,
});

export const SET_CONNECTED = "SET_CONNECTED";
export const setConnected = (connected: boolean) => ({
	type: SET_CONNECTED as "SET_CONNECTED",
	connected,
});

export const SET_RECONNECTION_LIMIT = "SET_RECONNECTION_LIMIT";
export const setReconnectionLimit = (reconnectionLimit: boolean) => ({
	type: SET_RECONNECTION_LIMIT as "SET_RECONNECTION_LIMIT",
	reconnectionLimit,
});

export type SetConnectedAction = ReturnType<typeof setConnected>;
export type SetConnectingAction = ReturnType<typeof setConnecting>;
export type SetReconnectionLimitAction = ReturnType<typeof setReconnectionLimit>;

export const connection: Reducer<
	ConnectionState,
	| SetConnectedAction
	| SetReconnectionLimitAction
	| SetConnectingAction
	| ConnectAction
	| SwitchSessionAction
> = (state = initialState, action) => {
	switch (action.type) {
		case "SET_CONNECTED": {
			return {
				...state,
				connected: action.connected,
				// Never reset once true: a past connection attempt is what gates
				// automatic reconnection, regardless of the current connected state.
				hasAttemptedConnection: state.hasAttemptedConnection || action.connected,
			};
		}

		case "SET_CONNECTING": {
			return {
				...state,
				connecting: action.connecting,
			};
		}

		case "SET_RECONNECTION_LIMIT": {
			return {
				...state,
				reconnectionLimit: action.reconnectionLimit,
			};
		}

		case "CONNECT":
		case "SWITCH_SESSION": {
			// A session switch connects the socket directly, bypassing CONNECT.
			// It is still a deliberate connection request, so it must arm the
			// reconnect latch even if this first attempt fails (e.g. offline).
			if (state.hasAttemptedConnection) return state;

			return {
				...state,
				hasAttemptedConnection: true,
			};
		}

		default: {
			return state;
		}
	}
};
