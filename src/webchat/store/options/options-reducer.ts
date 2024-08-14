import { Reducer } from "redux";
import { Options } from "@cognigy/socket-client/lib/interfaces/options";

export type OptionsState = Pick<Options, 'userId' | 'sessionId' | 'channel'>;

const getInitialState = (): OptionsState => ({
    channel: '',
    sessionId: '',
    userId: ''
});

const SET_OPTIONS = 'SET_OPTIONS';
export const setOptions = (options: Options) => ({
    type: SET_OPTIONS as 'SET_OPTIONS',
    options
});
export type SetOptionsAction = ReturnType<typeof setOptions>;

const SET_USER_ID = 'SET_USER_ID';
export const setUserId = (userId: string) => ({
    type: SET_USER_ID as 'SET_USER_ID',
    userId
});
export type SetUserIdAction = ReturnType<typeof setUserId>;

export const options: Reducer<OptionsState, SetOptionsAction | SetUserIdAction> = (state = getInitialState(), action) => {
    switch (action.type) {
        case 'SET_OPTIONS': {
            return action.options;
        }
            
        case 'SET_USER_ID': {
            return {
				...state,
				userId: action.userId,
			};
        }

        default:
            return state;
    }
};
