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
 *
 * Scope: this freezes the element tree (types + props) from the last active
 * commit, not the subtree's output — components inside keep their own
 * Redux/context subscriptions and can still re-render with fresh state
 * during the exit. Sufficient here, since it's the *structural* swap to the
 * next screen (new input, remounted live region) that must not happen.
 */
const FreezeOnExit: FC<{ active: boolean; children: ReactNode }> = ({ active, children }) => {
	const lastActive = useRef<ReactNode>(null);
	useEffect(() => {
		if (active) lastActive.current = children;
	});
	return <>{active ? children : lastActive.current}</>;
};

export default FreezeOnExit;
