import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserTypingState {
	shouldSendUserTypingOff: boolean;
	typingTimeoutId: undefined | ReturnType<typeof setTimeout>;
}

const initialState: UserTypingState = {
	shouldSendUserTypingOff: false,
	typingTimeoutId: undefined,
};

const userTyping = createSlice({
	name: "userTyping",
	initialState,
	reducers: {
		setShouldSendUserTypingOff: (state, action: PayloadAction<boolean>) => {
			state.shouldSendUserTypingOff = action.payload;
		},
		setTypingTimeoutId: (
			state,
			action: PayloadAction<ReturnType<typeof setTimeout> | undefined>,
		) => {
			state.typingTimeoutId = action.payload;
		},
	},
});

export const { setShouldSendUserTypingOff, setTypingTimeoutId } = userTyping.actions;
export default userTyping.reducer;
