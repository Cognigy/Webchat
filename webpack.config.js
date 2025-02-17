const path = require("path");

module.exports = {
	mode: "development",
	entry: ["./src/webchat-embed/index.tsx"],
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "webchat.js",
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"],
	},
	node: {},
	// devtool: 'source-map',
	module: {
		rules: [
			{
				// Include sound files for message notification sound
				test: /\.(mp3)$/i,
				use: [{ loader: "url-loader" }],
			},
			{
				// Include ts, tsx, js, and jsx files.
				test: /\.(ts|js)x?$/,
				loader: "babel-loader",
				options: {
					presets: ["@babel/typescript", "@babel/preset-react"],
					compact: false,
				},
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				// Get rid off this loader as it is not actively maintained and also produces a security vulnerability
				// See https://github.com/jhamlet/svg-react-loader/pull/158#issuecomment-2652143150
				// A workaround for this vulnerability is available until this library is removed (See package.json#overrides)
				test: /\.svg$/,
				exclude: /node_modules/,
				use: {
					loader: "@svgr/webpack",
					options: {
						icon: true,
					}
				},
			},
		],
	},
	devServer: {
		port: 8787,
	},
	plugins: [],
};
