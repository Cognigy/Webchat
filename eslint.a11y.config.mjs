import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

/**
 * Dedicated accessibility lint config used by the `lint:a11y` script and the
 * a11y CI gate (.github/workflows/lint.yml).
 *
 * Unlike the main eslint.config.mjs (where jsx-a11y runs as warnings during the
 * warn-first rollout), this config runs ONLY the jsx-a11y "recommended" ruleset
 * as ERRORS. That lets CI block PRs on accessibility regressions without being
 * affected by the warn-first severity or by unrelated pre-existing lint debt.
 *
 * During the warn-first rollout this command is expected to report violations;
 * it is wired into the CI gate once the codebase has been triaged (see
 * docs/accessibility.md).
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
