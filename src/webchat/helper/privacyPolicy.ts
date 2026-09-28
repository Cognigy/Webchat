const STORAGE_KEY = "hasAcceptedTerms";
const SUN_STORAGE_KEY = "acceptedSunSessionId";

/**
 * System Use Notification (AC-8 / FedRAMP) — per-session acceptance.
 * Keyed by sessionId rather than userId: acceptance resets with every new
 * conversation session. Unlike privacyNotice, returns false (show notice)
 * when no storage is available, rather than assuming accepted.
 */
export function hasAcceptedSunInStorage(
	browserStorage: Storage | null,
	sessionId: string,
): boolean {
	if (!browserStorage) {
		// No storage means we cannot record acceptance — always show the notice.
		return false;
	}
	return browserStorage.getItem(SUN_STORAGE_KEY) === sessionId;
}

export function setHasAcceptedSunInStorage(browserStorage: Storage, sessionId: string): void {
	browserStorage?.setItem?.(SUN_STORAGE_KEY, sessionId);
}

function getHasAcceptedTermsIds(browserStorage: Storage): string[] {
	let userIds: string[] = [];

	if (browserStorage) {
		const stored = browserStorage.getItem(STORAGE_KEY);

		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (Array.isArray(parsed)) {
					userIds = parsed;
				}
			} catch (error) {
				console.error(
					`[Webchat Privacy Policy]: Error parsing ${STORAGE_KEY} from ${browserStorage}`,
					error,
				);
			}
		}
	}

	return userIds;
}

export function hasAcceptedTermsInStorage(browserStorage: Storage | null, userId: string) {
	// We assume that the user has accepted the terms if there is no browser storage
	// available to store the information.
	if (!browserStorage) {
		console.warn("No browser storage available to store accepted terms.");
		return true;
	}

	const hasAcceptedTermsIds = getHasAcceptedTermsIds(browserStorage);

	return hasAcceptedTermsIds.includes(userId);
}

export function setHasAcceptedTermsInStorage(browserStorage: Storage, userId: string) {
	const hasAcceptedTermsIds = getHasAcceptedTermsIds(browserStorage);

	hasAcceptedTermsIds.push(userId);

	const uniqueUserIds = JSON.stringify([...new Set(hasAcceptedTermsIds.filter(Boolean))]);

	browserStorage?.setItem?.(STORAGE_KEY, uniqueUserIds);
}

/**
 * Returns true if any mandatory notice (System Use Notification or Privacy Notice)
 * still needs to be accepted before the chat screen can be shown.
 *
 * Use this as the single gate before dispatching SHOW_CHAT_SCREEN so the socket
 * never connects while a notice is pending. Checks both conditions in one place
 * to prevent the class of bug where one path guards only one notice.
 */
export function isNoticePending(
	settings: {
		systemUseNotification?: { enabled?: boolean };
		privacyNotice: { enabled: boolean };
	},
	ui: {
		hasAcceptedSystemUseNotification: boolean;
		hasAcceptedTerms: boolean;
	},
): boolean {
	const sunPending =
		!!settings.systemUseNotification?.enabled && !ui.hasAcceptedSystemUseNotification;
	const privacyPending = settings.privacyNotice.enabled && !ui.hasAcceptedTerms;
	return sunPending || privacyPending;
}

