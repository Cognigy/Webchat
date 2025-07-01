import tinycolor from "tinycolor2";

export interface IWebchatTheme {
	// Webchat V3 theme colors
	// Primary Colors
	primaryColor: string;
	primaryColorHover: string;
	primaryColorDisabled: string;
	primaryColorFocus: string;

	primaryContrastColor: string;

	// Secondary Colors
	secondaryColor: string;
	secondaryColorHover: string;
	secondaryColorDisabled: string;
	secondaryContrastColor: string;

	// Meta Colors
	backgroundHome: string;
	backgroundWebchat: string;
	backgroundBotMessage: string;
	backgroundUserMessage: string;
	backgroundEngagementMessage: string;

	textLink: string;
	textLinkHover: string;
	textLinkDisabled: string;

	//Basic Colors
	black10: string;
	black20: string;
	black40: string;
	black50: string;
	black60: string;
	black80: string;
	black95: string;
	white: string;

	textDark: string;
	textLight: string;

	// Confirmation Colors
	green: string;
	green10: string;
	red: string;
	red10: string;
	red20: string;
	red30: string;
	red40: string;

	// Legacy Webchat V2 theme colors
	primaryStrongColor: string;
	primaryWeakColor: string;
	primaryGradient: string;
	primaryStrongGradient: string;

	greyColor: string;
	greyStrongColor: string;
	greyWeakColor: string;
	greyContrastColor: string;

	shadow: string;
	messageShadow: string;

	unitSize: number;
	blockSize: number;
	cornerSize: number;

	fontFamily: string;
}

const BLACK_10 = "#1A1A1A";
const MAX_ITERATIONS = 20;
const MIN_CONTRAST = 4.5;
const LIGHTEN_OR_DARKEN_STEP = 5;

export const transformContrastColor = (color: string) =>
	tinycolor(color).setAlpha(0.95).toHslString();

export const getActionColor = (color: string) =>
	tinycolor(color).triad()[2].brighten(5).toHslString();

const readabilityCache = new Map<
	string,
	{ contrastWithBlack: number; contrastWithWhite: number }
>();

const isLightByContrast = (color: string): boolean => {
	if (!readabilityCache.has(color)) {
		const contrastWithBlack = tinycolor.readability(color, "#000000");
		const contrastWithWhite = tinycolor.readability(color, "#FFFFFF");
		readabilityCache.set(color, { contrastWithBlack, contrastWithWhite });
	}
	const { contrastWithBlack, contrastWithWhite } = readabilityCache.get(color)!;
	return contrastWithBlack > contrastWithWhite;
};

const strong = (color: string) =>
	(isLightByContrast(color)
		? tinycolor(color).lighten()
		: tinycolor(color).darken()
	).toHslString();

const weak = (color: string) =>
	(isLightByContrast(color)
		? tinycolor(color).darken()
		: tinycolor(color).lighten()
	).toHslString();

const getGradient = (color: string) => {
	const base = tinycolor(color);

	const left = base.clone().brighten(4);
	const right = base.clone();

	const gradient = `linear-gradient(185deg, ${left}, ${right})`;

	return gradient;
};

/**
 * Derive hover color from given color
 * @param color
 */
export const deriveHoverColor = (color: string) => {
	const hsl = tinycolor(color).toHsl();
	// If color is very close to white, darken for hover effect
	if (hsl.l > 0.92) {
		hsl.l = Math.max(0, hsl.l - 0.08);
		return tinycolor(hsl).toHslString();
	}
	// If color is very close to black, lighten for hover effect
	if (hsl.l < 0.12) {
		hsl.l = Math.min(1, hsl.l + 0.18);
		return tinycolor(hsl).toHslString();
	}
	// Otherwise, lighten a light color, darken a dark color
	if (isLightByContrast(color)) {
		hsl.l = Math.min(1, hsl.l + 0.08);
	} else {
		hsl.l = Math.max(0, hsl.l - 0.08);
	}
	return tinycolor(hsl).toHslString();
};

const deriveDisabledColor = (color: string) => {
	const hslColor = tinycolor(color).toHsl();
	hslColor.l = 0.9;

	return tinycolor(hslColor).toHslString();
};

// Calculate the best contrast color based on the provided color and the light/dark text colors.
export const getContrastColor = (color: string, theme: IWebchatTheme) => {
	const textDark = theme.textDark || "#1A1A1A";
	const textLight = theme.textLight || "#FFFFFF";
	const contrastLight = tinycolor.readability(color, textLight);
	const contrastDark = tinycolor.readability(color, textDark);
	if (contrastLight >= MIN_CONTRAST || contrastDark >= MIN_CONTRAST) {
		return contrastLight > contrastDark ? textLight : textDark;
	}
	// Fallback to black/white if neither theme colors meets 4.5:1 (minimum for WCAG 2.1 Level AA)
	const whiteContrast = tinycolor.readability(color, "#FFFFFF");
	const blackContrast = tinycolor.readability(color, "#000000");
	return whiteContrast > blackContrast ? "#FFFFFF" : "#000000";
};

// Get primary color variant that is accessible against the given background color
export const getAccessiblePrimaryVariant = (
	primaryColor: string,
	backgroundColor: string,
): string => {
	let bestVariant = primaryColor;
	let bestContrast = tinycolor.readability(primaryColor, backgroundColor);
	// Try darkening
	let darkVariant = primaryColor;
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		darkVariant = tinycolor(darkVariant).darken(LIGHTEN_OR_DARKEN_STEP).toHexString();
		const contrast = tinycolor.readability(darkVariant, backgroundColor);
		if (contrast >= MIN_CONTRAST) return darkVariant;
		if (contrast > bestContrast) {
			bestContrast = contrast;
			bestVariant = darkVariant;
		}
	}
	// Try lightening
	let lightVariant = primaryColor;
	for (let i = 0; i < MAX_ITERATIONS; i++) {
		lightVariant = tinycolor(lightVariant).lighten(LIGHTEN_OR_DARKEN_STEP).toHexString();
		const contrast = tinycolor.readability(lightVariant, backgroundColor);
		if (contrast >= MIN_CONTRAST) return lightVariant;
		if (contrast > bestContrast) {
			bestContrast = contrast;
			bestVariant = lightVariant;
		}
	}
	return bestVariant;
};

export const createWebchatTheme = (theme: Partial<IWebchatTheme> = {}): IWebchatTheme => {
	const htmlDirection = document?.documentElement?.dir;
	const bodyDirection = document?.body?.dir;
	const isRTL = htmlDirection === "rtl" || bodyDirection === "rtl";

	// Webchat endpoint default color
	const webchatEndpointDefaultColor = "#2455E6";

	// Webchat 3 Theme color defaults
	const primaryColor = "#2455E6";

	const secondaryColor = "#1A1A1A";

	let backgroundHome =
		"radial-gradient(204.5% 136.79% at 0.53% 95.79%, #EDECF9 0%, #BFBAFF 31.77%, #2152E3 65.63%, #05309E 100%)";
	if (isRTL) {
		backgroundHome =
			"radial-gradient(at right 95.79%, hsl(225, 80%, 32%) 0%, #2455E6 34.37%, hsl(225, 80%, 72%) 68.23%, hsl(225, 79%, 92%) 100%)";
	}
	const backgroundWebchat = "#FFFFFF";
	const backgroundBotMessage = "#FFFFFF";
	const backgroundUserMessage = "#E8EBFF";
	const backgroundEngagementMessage = "#FFFFFF";

	const textLink = "#6688ED";
	const textLinkHover = "#1947D2";
	const textLinkDisabled = "#D1DCFA";

	const black10 = BLACK_10;
	const black20 = "#333333";
	const black40 = "#666666";
	const black50 = "#808080";
	const black60 = "#999999";
	const black80 = "#CCCCCC";
	const black95 = "#F2F2F2";
	const white = "#FFFFFF";

	const textDark = black10;
	const textLight = white;

	const green = "#009918";
	const green10 = "#E5F5E8";
	const red = "#FF0000";
	const red10 = "#FFE5E5";
	const red20 = "#E55050";
	const red30 = "#E02E2E";
	const red40 = "#B22F2F";

	// calculate new gradient based on optional theme.primaryColor if no theme.backgroundHome is given
	if (
		theme.primaryColor &&
		theme.primaryColor !== webchatEndpointDefaultColor &&
		!theme.backgroundHome
	) {
		if (tinycolor(theme.primaryColor).isLight()) {
			backgroundHome = `radial-gradient(204.5% 136.79% at 0.53% 95.79%, ${tinycolor(
				theme.primaryColor,
			)
				.lighten(20)
				.toHslString()} 0%, ${theme.primaryColor} 31.77%, ${tinycolor(theme.primaryColor)
				.darken(20)
				.toHslString()} 65.63%, ${tinycolor(theme.primaryColor)
				.darken(40)
				.toHslString()} 100%)`;
		} else {
			backgroundHome = `radial-gradient(204.5% 136.79% at 0.53% 95.79%, ${tinycolor(
				theme.primaryColor,
			)
				.lighten(40)
				.toHslString()} 0%, ${tinycolor(theme.primaryColor)
				.lighten(20)
				.toHslString()} 31.77%, ${theme.primaryColor} 65.63%, ${tinycolor(
				theme.primaryColor,
			)
				.darken(20)
				.toHslString()} 100%)`;
		}
	}

	if (!theme.primaryColor) theme.primaryColor = primaryColor;

	if (!theme.primaryColorHover) theme.primaryColorHover = deriveHoverColor(theme.primaryColor);

	if (!theme.primaryColorDisabled)
		theme.primaryColorDisabled = deriveDisabledColor(theme.primaryColor);

	if (!theme.primaryContrastColor)
		theme.primaryContrastColor = getContrastColor(theme.primaryColor, theme as IWebchatTheme);

	if (!theme.primaryColorFocus)
		theme.primaryColorFocus = getAccessiblePrimaryVariant(
			theme.primaryColor,
			theme.white || "#FFFFFF",
		);

	if (!theme.secondaryColor) theme.secondaryColor = secondaryColor;

	if (!theme.secondaryColorHover)
		theme.secondaryColorHover = deriveHoverColor(theme.secondaryColor);

	if (!theme.secondaryColorDisabled)
		theme.secondaryColorDisabled = deriveDisabledColor(theme.secondaryColor);

	if (!theme.secondaryContrastColor)
		theme.secondaryContrastColor = getContrastColor(
			theme.secondaryColor,
			theme as IWebchatTheme,
		);

	if (!theme.backgroundHome) theme.backgroundHome = backgroundHome;

	if (!theme.backgroundWebchat) theme.backgroundWebchat = backgroundWebchat;

	if (!theme.backgroundBotMessage) theme.backgroundBotMessage = backgroundBotMessage;

	if (!theme.backgroundUserMessage) theme.backgroundUserMessage = backgroundUserMessage;

	if (!theme.backgroundEngagementMessage)
		theme.backgroundEngagementMessage = backgroundEngagementMessage;

	if (!theme.textLink) theme.textLink = textLink;

	if (!theme.textLinkHover) theme.textLinkHover = textLinkHover;

	if (!theme.textLinkDisabled) theme.textLinkDisabled = textLinkDisabled;

	if (!theme.black10) theme.black10 = black10;

	if (!theme.black20) theme.black20 = black20;

	if (!theme.black40) theme.black40 = black40;

	if (!theme.black50) theme.black50 = black50;

	if (!theme.black60) theme.black60 = black60;

	if (!theme.black80) theme.black80 = black80;

	if (!theme.black95) theme.black95 = black95;

	if (!theme.white) theme.white = white;

	if (!theme.textDark) theme.textDark = textDark;

	if (!theme.textLight) theme.textLight = textLight;

	if (!theme.green) theme.green = green;

	if (!theme.green10) theme.green10 = green10;

	if (!theme.red) theme.red = red;

	if (!theme.red10) theme.red10 = red10;

	if (!theme.red20) theme.red20 = red20;

	if (!theme.red30) theme.red30 = red30;

	if (!theme.red40) theme.red40 = red40;

	if (!theme.primaryWeakColor) theme.primaryWeakColor = weak(theme.primaryColor);

	if (!theme.primaryStrongColor) theme.primaryStrongColor = strong(theme.primaryColor);

	if (!theme.primaryGradient) theme.primaryGradient = getGradient(theme.primaryColor);

	if (!theme.primaryStrongGradient)
		theme.primaryStrongGradient = getGradient(theme.primaryStrongColor);

	if (!theme.shadow)
		theme.shadow =
			"0 5px 18px 0 rgba(151, 124, 156, 0.2), 0 5px 32px 0 rgba(203, 195, 212, 0.2), 0 8px 58px 0 rgba(216, 212, 221, 0.1)";

	if (!theme.messageShadow)
		theme.messageShadow =
			"0 5px 9px 0 rgba(151,124,156,0.1), 0 5px 16px 0 rgba(203,195,212,0.1), 0 8px 20px 0 rgba(216,212,221,0.1)";

	if (!theme.greyColor) theme.greyColor = "#e6e6e6";

	if (!theme.greyWeakColor) theme.greyWeakColor = weak(theme.greyColor);

	if (!theme.greyStrongColor) theme.greyStrongColor = strong(theme.greyColor);

	if (!theme.greyContrastColor)
		theme.greyContrastColor = getContrastColor(theme.greyColor, theme as IWebchatTheme);

	if (!theme.unitSize) theme.unitSize = 8;

	if (!theme.blockSize) theme.blockSize = theme.unitSize * 7;

	if (!theme.cornerSize) theme.cornerSize = theme.unitSize / 2;

	if (!theme.fontFamily) theme.fontFamily = "Figtree, sans-serif";

	return theme as IWebchatTheme;
};

export interface IColorProps {
	color?: "primary" | "default" | "grey";
}
