const webpack = require("webpack");
const config = require("./webpack.config");
const path = require("path");
const { version } = require("./package.json");

config.mode = "production";
config.plugins.push(
	new webpack.BannerPlugin({
		banner: `[file] v${version}\nhttps://github.com/Cognigy/Webchat/tree/v${version}\nhttps://github.com/Cognigy/Webchat/tree/v${version}/OSS_LICENSES.txt`,
	}),
);

config.mode = "production";
config.output = {
	path: path.resolve(__dirname, "dist"),
	filename: "webchat.esm.js",
	library: {
		type: "module",
	},
	module: true,
	environment: {
		module: true,
		dynamicImport: true,
		destructuring: true,
	},
};
config.experiments = {
	outputModule: true,
};
config.resolve = {
	...config.resolve,
	mainFields: ["module", "main"],
	fallback: {
		tty: false,
		util: false,
		os: false,
	},
};

config.optimization = {
	concatenateModules: false,
	minimize: false,
	runtimeChunk: false,
	splitChunks: false,
	usedExports: true,
};

config.externalsType = "module";
config.externals = {
	react: "react",
	"react-dom": "react-dom",
};

module.exports = config;
