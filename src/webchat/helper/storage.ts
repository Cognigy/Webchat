import { IWebchatSettings } from "../../common/interfaces/webchat-config";
import { isValidJSON } from "../../webchat-ui/utils/isValidJSON";

/**
 * Returns the browser storage that should be used for this Webchat Embedding.
 *
 * Note that for restricted environments, even a read-access to `window.localStorage`
 * can result in an Error to throw, so we're first looking at the setting before accessing
 * either of those.
 */
export const getStorage = (
	embeddingConfiguration: Pick<
		IWebchatSettings["embeddingConfiguration"],
		"disableLocalStorage" | "useSessionStorage"
	>,
) => {
	if (embeddingConfiguration.disableLocalStorage) return null;

	if (embeddingConfiguration.useSessionStorage) return window.sessionStorage;

	return window.localStorage;
};

export const getAllConversations = (
	storage: Storage,
	currentUserId?: string,
	currentSessionId?: string,
	currentURLtoken?: string,
) => {
	return Object.keys(storage).reduce((acc, item) => {
		// skip missing userId or URLtoken
		if (!currentUserId || !currentURLtoken) return acc;

		const data = storage.getItem(item) || "";

		// skip if not JSON
		if (!isValidJSON(item) || !isValidJSON(data)) return acc;

		const userId = JSON.parse(item)?.[1] || "";
		const sessionId = JSON.parse(item)?.[2] || "";
		const URLtoken = JSON.parse(item)?.[3] || "";

		// skip different userID
		if (currentUserId !== userId) return acc;

		// skip different URLtoken
		if (currentURLtoken !== URLtoken) return acc;

		const messages = JSON.parse(data)?.messages;

		// skip empty
		if (!Array.isArray(messages) || messages.length === 0) return acc;

		acc[sessionId] = JSON.parse(data);
		return acc;
	}, {});
};
