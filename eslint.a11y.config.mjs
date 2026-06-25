import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

/**
 * Dedicated accessibility lint config used by the `lint:a11y` script and the
 * a11y CI gate (.github/workflows/lint.yml).
 *
 * This config runs ONLY the jsx-a11y "recommended" ruleset (the main
 * eslint.config.mjs also enforces these rules as errors). Scoping the CI gate
 * to a11y rules alone lets it block PRs on accessibility regressions without
 * being affected by unrelated, pre-existing lint debt elsewhere in the project.
 *
 * See docs/accessibility.md for the full accessibility governance setup.
 */
export default [
	{
		files: ["src/**/*.{ts,tsx,js,jsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaFeatures: { jsx: true },
				sourceType: "module",
			},
			globals: globals.browser,
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin,
			react: reactPlugin,
			"jsx-a11y": jsxA11y,
		},
		// Only the accessibility rules, all as errors.
		rules: jsxA11y.flatConfigs.recommended.rules,
	},
];
