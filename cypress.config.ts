import { defineConfig } from "cypress";

export default defineConfig({
	video: false,
	viewportHeight: 800,
	/**
	 * Retry failed tests in CI (`cypress run`) but never interactively.
	 *
	 * The suite has a handful of timing-sensitive specs — a real-socket
	 * reconnection test, and a11y specs that wait on announcements — which
	 * intermittently exceed the 4s default command timeout on loaded CI
	 * runners while passing locally and on re-run. With no retries a single
	 * hiccup failed all 428 tests, so unrelated PRs went red at random.
	 *
	 * A test that needs a retry to pass is still a signal: check the run
	 * output for retried tests rather than assuming a green check means
	 * first-attempt green.
	 */
	retries: {
		runMode: 2,
		openMode: 0,
	},
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
