import { Middleware } from "@reduxjs/toolkit";

import { setShouldSendUserTypingOff, setTypingTimeoutId } from "./slice";
import { StoreState } from "../store";
import { TSetTextActiveAction } from "../input/input-reducer";
import { SendMessageAction, setUserTyping } from "../messages/message-middleware";

import { inputContentUpdated } from "./actions";

type Actions = TSetTextActiveAction | SendMessageAction | typeof inputContentUpdated;

// <<<Outgoing TypingStatus>>>
export const userTypingMiddleware: Middleware<object, StoreState> =
	// TODO: fix ts warning
	store => next => (action: Actions) => {
		const state = store.getState();

		switch (action.type) {
			// TYPING_OFF
			case "SET_TEXT_ACTIVE": // ON BLUR input field,
			case "SEND_MESSAGE": // ON SEND message,
				// if we already sent "typing_on", we send "typing_off" immediately!
				if (state.userTyping.shouldSendUserTypingOff) {
					store.dispatch(setUserTyping(false));
					store.dispatch(setShouldSendUserTypingOff(false));
				}
				break;

			// TYPING_ON + TYPING_OFF
			case "input/content-updated":
				// User is typing and we have not sent "typing_on" yet.
				if (!state.userTyping.shouldSendUserTypingOff) {
					// Send "typing_on". Remember we did it.
					store.dispatch(setUserTyping(true));
					store.dispatch(setShouldSendUserTypingOff(true));
				} else {
					// User is typing and we already sent "typing_on". Reset the timer.
					clearTimeout(state.userTyping.typingTimeoutId);

					const timeoutId = setTimeout(() => {
						// Send "typing_off" after 2 sec if has not been sent at this point
						if (store.getState().userTyping.shouldSendUserTypingOff) {
							store.dispatch(setUserTyping(false));
							store.dispatch(setShouldSendUserTypingOff(false));
						}
					}, 2_000);
					store.dispatch(setTypingTimeoutId(timeoutId));
				}
				break;
		}

		return next(action);
	};
