import { IWebchatConfig } from "../../common/interfaces/webchat-config";

/**
 * Returns the locale to format dates and times with, from
 * `customTranslations.dateLocale` (a BCP 47 tag such as "de" or "fr-CA").
 *
 * Returns `undefined` when the setting is missing, is not a valid tag, or names
 * a language this browser cannot format dates in (e.g. "tlh"), so `Intl` falls
 * back to the browser's locale (the previous behavior). An invalid tag would
 * otherwise make `Intl` throw a RangeError and break the render, and an
 * unsupported one would put a wrong `lang` on the browser-locale fallback text.
 *
 * Both formatters are checked because the setting covers relative times here
 * and clock times in @cognigy/chat-components, which resolves it with the same
 * rules: either both surfaces use the locale, or both fall back.
 */
export const getDateLocale = (config?: IWebchatConfig): string | undefined => {
	const dateLocale = config?.settings?.customTranslations?.dateLocale;
	if (typeof dateLocale !== "string" || !dateLocale.trim()) return undefined;

	try {
		const [locale] = Intl.getCanonicalLocales(dateLocale.trim());
		const isSupported =
			Intl.RelativeTimeFormat.supportedLocalesOf(locale).length > 0 &&
			Intl.DateTimeFormat.supportedLocalesOf(locale).length > 0;

		return isSupported ? locale : undefined;
	} catch {
		return undefined;
	}
};
