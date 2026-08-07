import { IWebchatConfig } from "../../common/interfaces/webchat-config";
import { PrevConversationsState } from "../../webchat/store/previous-conversations/previous-conversations-reducer";

export const DEFAULT_AI_AGENT_NOTICE_TEXT = "You're now chatting with an AI Agent.";

/**
 * Whether the current session started as a brand-new conversation rather
 * than a previous conversation reopened from the conversations list —
 * gates the AI-agent notice announcement (CGY-3519).
 * `id` guards against renders where `currentSession` has already changed
 * but this state hasn't been re-evaluated yet (the session id updates
 * asynchronously after the socket switch). `announceKey` dedupes the
 * announcement per conversation; it differs from `id` only for the page
 * load's first conversation, which starts announceable before the connect
 * assigns its session id (see computeNoticeSession).
 */
export interface NoticeSession {
	id: string;
	isNew: boolean;
	announceKey: string;
}

// Inactive until the session is evaluated on mount / session change.
export const INITIAL_NOTICE_SESSION: NoticeSession = { id: "", isNew: false, announceKey: "" };

/**
 * (Re-)evaluate whether the current session is a brand-new conversation.
 * `prevConversationsSnapshot` must predate the session change: sessions
 * get upserted into prevConversations as soon as a message is sent or
 * received (e.g. auto-inject, in the same update batch as the session
 * switch), so the current map may already contain a genuinely new
 * session. A session found in the snapshot is a reopened previous
 * conversation (or a restored one after a reload) — not announced.
 *
 * The page load's first conversation exists on screen before the socket
 * connect assigns its session id (`currentSessionId` is "" until then).
 * That id arriving is not a new conversation, so the announcement key
 * is kept — a notice already announced (or pending) under the "" key is
 * not repeated under the id.
 *
 * `hasRestoredPersistedHistory` covers the page reload of a persisted
 * conversation: the restored session IS in the conversations map, but
 * that map is filled in the same React commit as the session id, so the
 * pre-change snapshot is still empty and the lookup alone would call the
 * session brand-new. The flag (set only when RESET_STATE restores a
 * non-empty history) is consulted for the page load's first connect
 * only — later restores (reopening a previous conversation) are already
 * covered by the snapshot lookup, and the flag must not silence a
 * brand-new conversation started afterwards.
 */
export function computeNoticeSession(
	prev: NoticeSession,
	currentSessionId: string,
	prevConversationsSnapshot: PrevConversationsState,
	hasRestoredPersistedHistory?: boolean,
): NoticeSession {
	const isRestoredFirstConnect = prev.id === "" && !!hasRestoredPersistedHistory;
	const isNew = !prevConversationsSnapshot?.[currentSessionId] && !isRestoredFirstConnect;
	const isFirstConnectOfNewConversation = prev.id === "" && prev.isNew && isNew;
	return {
		id: currentSessionId,
		isNew,
		announceKey: isFirstConnectOfNewConversation ? prev.announceKey : currentSessionId,
	};
}

/**
 * The AI-agent notice text to announce through the chat log's live
 * region, or undefined when nothing should be announced. Announced once
 * per brand-new session (reopened previous conversations stay silent)
 * and held while the disconnect overlay is open (session switches
 * reconnect the socket and open it — its dialog and focus utterances
 * would cancel the notice; on close, the intro becomes pending again
 * and is announced after the "Connection restored" utterances).
 */
export function getAIAgentNoticeIntroText(args: {
	behavior: IWebchatConfig["settings"]["behavior"];
	showDisconnectOverlay: boolean;
	noticeSession: NoticeSession;
	currentSessionId: string;
	announcedKeys: ReadonlySet<string>;
}): string | undefined {
	const { behavior, showDisconnectOverlay, noticeSession, currentSessionId, announcedKeys } =
		args;
	const shouldAnnounce =
		behavior.enableAIAgentNotice !== false &&
		!showDisconnectOverlay &&
		noticeSession.isNew &&
		noticeSession.id === currentSessionId &&
		!announcedKeys.has(noticeSession.announceKey);
	if (!shouldAnnounce) return undefined;

	return behavior.AIAgentNoticeText || DEFAULT_AI_AGENT_NOTICE_TEXT;
}
