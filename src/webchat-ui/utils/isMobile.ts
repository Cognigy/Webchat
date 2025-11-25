// Returns true if the viewport width is 575px or less.
export const isMobileViewport = (): boolean => {
	return typeof window !== "undefined" && window.innerWidth <= 575;
};
