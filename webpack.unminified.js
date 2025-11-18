const webpack = require("webpack");
const { version } = require("./package.json");

const config = require("./webpack.config");

config.mode = "production";
config.output.filename = "webchat.unminified.js";

config.plugins.push(
	new webpack.BannerPlugin({
		banner: `[file] v${version}\nhttps://github.com/Cognigy/Webchat/tree/v${version}\nhttps://github.com/Cognigy/Webchat/tree/v${version}/OSS_LICENSES.txt`,
	}),
);

config.plugins.push(
	new webpack.optimize.LimitChunkCountPlugin({
		maxChunks: 1,
	}),
);

config.optimization = {
	minimize: false,
	usedExports: true,
};

module.exports = config;
