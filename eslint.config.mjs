import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import globals from "globals";

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
];
