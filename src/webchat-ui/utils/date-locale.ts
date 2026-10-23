import { IWebchatConfig } from "../../common/interfaces/webchat-config";

/**
 * Returns the locale to format dates and times with, from
 * `customTranslations.dateLocale` (a BCP 47 tag such as "de" or "fr-CA").
 *
 * Returns `undefined` when the setting is missing or is not a valid tag, so
 * `Intl` falls back to the browser's locale (the previous behavior). An invalid
 * tag would otherwise make `Intl` throw a RangeError and break the render.
 */
export const getDateLocale = (config?: IWebchatConfig): string | undefined => {
	const dateLocale = config?.settings?.customTranslations?.dateLocale;
	if (typeof dateLocale !== "string" || !dateLocale.trim()) return undefined;

	try {
		return Intl.getCanonicalLocales(dateLocale.trim())[0];
	} catch {
		return undefined;
	}
};
