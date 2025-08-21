const webpack = require("webpack");
const { version } = require("./package.json");

const config = require("./webpack.config");

const TerserPlugin = require("terser-webpack-plugin");

config.mode = "production";
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
	minimize: true,
	minimizer: [
		new TerserPlugin({
			extractComments: false,
		}),
	],
	usedExports: true,
};

module.exports = config;
