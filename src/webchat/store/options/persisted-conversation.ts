import { StoreState } from "../store";
import { getOptionsKey } from "./options";
import { getStorage } from "../../helper/storage";

/**
 * Whether browser storage already holds a non-empty conversation for the
 * session this page load will connect with — i.e. whether the first
 * connect is going to restore a conversation rather than start one.
 *
 * This answers, BEFORE the socket connects, the question the AI-agent
 * notice needs answered (CGY-3519): a restored conversation is a
 * continuation and must not be announced. Waiting for the connect to
 * tell us instead is not an option — it can take longer than the
 * notice's 600ms announce delay, and an announcement cannot be taken
 * back.
 *
 * It deliberately mirrors the restore in `optionsMiddleware`'s
 * `SET_OPTIONS` handler: same `getStorage`, same `getOptionsKey`, same
 * "non-empty messages" condition that `RESET_STATE` uses to set
 * `hasRestoredPersistedHistory`. Reading the same inputs through the
 * same helpers is what makes the prediction and the restore agree —
 * including when they agree on "no": if the endpoint config (and with it
 * `URLToken`) has not loaded yet, the key misses here exactly as it
 * misses there, and nothing is restored either.
 *
 * `config.initialSessionId` is the pinned `sessionId` from the embedding
 * options. Without one, the socket client mints a fresh session id per
 * page load, which no stored entry can match, so there is nothing to
 * predict.
 */
// mapStateToProps runs on every dispatch, and a persisted conversation
// can be sizeable — so the parse is cached against the raw string it was
// derived from. `getItem` itself still runs every time, which is what
// keeps the answer current (the key changes once the endpoint config
// supplies its URLToken).
let lastRead: { key: string; raw: string | null; result: boolean } | null = null;

export const hasPersistedConversationForInitialSession = (state: StoreState): boolean => {
	const { disableLocalStorage, useSessionStorage } = state.config.settings.embeddingConfiguration;
	const browserStorage = getStorage({ disableLocalStorage, useSessionStorage });
	if (!browserStorage) return false;

	const sessionId = state.config.initialSessionId;
	if (!sessionId) return false;

	// `channel` is not part of the storage key; it is only in the type.
	const key = getOptionsKey(
		{ userId: state.options.userId, sessionId, channel: state.options.channel },
		state.config,
	);
	const persistedString = browserStorage.getItem(key);

	if (lastRead && lastRead.key === key && lastRead.raw === persistedString) {
		return lastRead.result;
	}

	let result = false;
	if (persistedString) {
		try {
			const messages = JSON.parse(persistedString)?.messages;
			result = Array.isArray(messages) && messages.length > 0;
		} catch (e) {
			result = false;
		}
	}

	lastRead = { key, raw: persistedString, result };
	return result;
};
