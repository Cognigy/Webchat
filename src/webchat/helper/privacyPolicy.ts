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
