// Returns true if the viewport width is 575px or less.
const MOBILE_BREAKPOINT_PX = 575;
export const isMobileViewport = (): boolean => {
	return typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT_PX;
};
