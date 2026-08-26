import { StoreState } from "../store/store";

export const shouldReestablishConnection = (store: StoreState) =>
	store?.connection?.hasAttemptedConnection;

type silentHandler = () => void;

export const onNetworkOn = (handler: silentHandler): silentHandler => {
	window.addEventListener("online", handler, false);

	return () => {
		window.removeEventListener("online", handler);
	};
};
