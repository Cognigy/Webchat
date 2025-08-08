import { defineConfig } from "cypress";

export default defineConfig({
	video: false,
	viewportHeight: 800,
	e2e: {
		baseUrl: "http://localhost:8787/",
		setupNodeEvents(on) {
			on("task", {
				log(message) {
					console.log(message);
					return null;
				},
			});
		},
	},
});
