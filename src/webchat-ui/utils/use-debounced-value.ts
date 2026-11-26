import { useEffect, useState } from "react";

/**
 * Returns `value` once it has stopped changing for `delayMs`.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number) => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		setTimeout(() => setDebouncedValue(value), delayMs);
	}, [value, delayMs]);

	return debouncedValue;
};
