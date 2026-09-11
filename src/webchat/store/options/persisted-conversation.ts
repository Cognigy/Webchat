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
 * same helpers is what keeps the prediction and the restore aligned —
 * including when they agree on "no": if the endpoint config (and with it
 * `URLToken`) has not loaded yet, the key misses here exactly as it
 * misses there, and nothing is restored either. The one case where they
 * part company is benign: a message sent before the first connect is
 * dispatched ahead of `setOptions`, so `RESET_STATE` finds a non-empty
 * history and skips the restore while this still says "continued" — the
 * session IS a continuation for the backend, so staying silent remains
 * the right outcome.
 *
 * `config.initialSessionId` is the pinned `sessionId` from the embedding
 * options. Without one, the socket client mints a fresh session id per
 * page load, which no stored entry can match, so there is nothing to
 * predict.
 */
// mapStateToProps runs on every dispatch and a persisted conversation can
// be sizeable, so this must not sit on the hot path: the parse is cached
// against the raw string it was derived from, and the read stops
// altogether once the answer is spent (see below). Until then `getItem`
// runs on every call, which is what keeps the answer current — the key
// changes once the endpoint config supplies its URLToken.
let lastRead: { key: string; raw: string | null; result: boolean } | null = null;

export const hasPersistedConversationForInitialSession = (state: StoreState): boolean => {
	const sessionId = state.config.initialSessionId;
	if (!sessionId) return false;

	// This page load ended up on a session other than the pinned one, so
	// nothing stored under the pinned key is being restored into it and
	// there is nothing to predict. "Start new conversation" from the
	// conversations list does this before the first connect
	// (`SWITCH_SESSION` with no id mints a fresh session id), and without
	// this guard that brand-new conversation would inherit the pinned
	// session's "continued" verdict and never be announced — the mirror
	// image of the bug this predicate exists for. A REopened previous
	// conversation also lands here, and is correctly silenced by the
	// `prevConversations` snapshot instead.
	if (state.options.sessionId && state.options.sessionId !== sessionId) return false;

	const { disableLocalStorage, useSessionStorage } = state.config.settings.embeddingConfiguration;

	try {
		const browserStorage = getStorage({ disableLocalStorage, useSessionStorage });
		if (!browserStorage) return false;

		// `channel` is not part of the storage key; it is only in the type.
		const key = getOptionsKey(
			{ userId: state.options.userId, sessionId, channel: state.options.channel },
			state.config,
		);

		// Once the first connect has assigned a session id the answer is
		// spent: `computeNoticeSession` consults it only while its own
		// `prev.id` is still "". The key is final well before that (userId
		// is dispatched on mount, URLToken with the config, and the connect
		// waits for the config), so the cache is populated by then and every
		// later dispatch is served without touching storage.
		if (state.options.sessionId && lastRead?.key === key) return lastRead.result;

		const persistedString = browserStorage.getItem(key);

		if (lastRead && lastRead.key === key && lastRead.raw === persistedString) {
			return lastRead.result;
		}

		let result = false;
		if (persistedString) {
			try {
				const messages = JSON.parse(persistedString)?.messages;
				result = Array.isArray(messages) && messages.length > 0;
			} catch {
				result = false;
			}
		}

		lastRead = { key, raw: persistedString, result };
		return result;
	} catch {
		// Restricted embeddings can throw on merely touching storage. The
		// restore reads it the same way, so nothing would be restored there
		// either — "no persisted conversation" is the truthful answer.
		return false;
	}
};
