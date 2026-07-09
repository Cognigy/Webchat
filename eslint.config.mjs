import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

/**
 * Accessibility (WCAG 2.2 AA) lint rules.
 *
 * The jsx-a11y "recommended" ruleset is enabled as ERRORS — the existing
 * codebase has been triaged and is clean (intentional exceptions carry scoped
 * `eslint-disable` comments with justifications). The dedicated `lint:a11y`
 * CI gate (eslint.a11y.config.mjs) enforces the same rules on every PR.
 *
 * See docs/accessibility.md for the full accessibility governance setup.
 */
const A11Y_SEVERITY = "error";

// Apply the jsx-a11y "recommended" ruleset, overriding only the severity while
// preserving each rule's original options. Rules the preset disables ("off")
// stay off. A rule entry is either a bare severity ("error" | "off") or a
// tuple [severity, options]; keep the options and swap the severity.
const a11yRecommendedRules = Object.fromEntries(
	Object.entries(jsxA11y.flatConfigs.recommended.rules).map(([ruleName, config]) => {
		const [severity, ...options] = Array.isArray(config) ? config : [config];
		if (severity === "off" || severity === 0) return [ruleName, config];
		return [ruleName, [A11Y_SEVERITY, ...options]];
	}),
);

export default [
	js.configs.recommended,
	...tsPlugin.configs["flat/recommended"],
	reactPlugin.configs.flat.recommended,
	{
		languageOptions: {
			globals: globals.browser,
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		rules: {
			"react/prop-types": "off",
			"no-empty": "off",
			"no-empty-function": "off",
			"@typescript-eslint/no-empty-function": "off",
			"@typescript-eslint/ban-ts-comment": "off",
		},
	},
	// Accessibility rules — applied to all JSX/TSX source.
	{
		files: ["**/*.{ts,tsx,js,jsx}"],
		plugins: {
			"jsx-a11y": jsxA11y,
		},
		rules: a11yRecommendedRules,
	},
];
