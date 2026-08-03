import React, { FC, ReactNode, useEffect, useRef } from "react";

/**
 * Renders children normally while active; while inactive, keeps showing the
 * children from the last active committed render.
 *
 * Used to freeze a leaving screen during its exit animation: the screen stays
 * mounted for the slide-out, but the navigation state already points at the
 * next screen — rendering that would mount the input (which autofocuses) and
 * remount the live region (which re-announces old messages). Freezing the
 * leaving view prevents both (CGY-3276). The ref is written in an effect
 * (commit phase) so discarded renders never pollute the frozen content.
 */
const FreezeOnExit: FC<{ active: boolean; children: ReactNode }> = ({ active, children }) => {
	const lastActive = useRef<ReactNode>(null);
	useEffect(() => {
		if (active) lastActive.current = children;
	});
	return <>{active ? children : lastActive.current}</>;
};

export default FreezeOnExit;
