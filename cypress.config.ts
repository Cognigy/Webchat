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

			/**
			 * Make CI Chrome report a desktop pointer.
			 *
			 * Headless Chromium on a Linux runner sees no mouse device and
			 * therefore matches `(hover: none)` and `(pointer: none)`, i.e.
			 * it styles the page as a touch device. UI that adapts to the
			 * pointer type — e.g. the launcher's icon-animation pause control,
			 * which is always visible under `(hover: none)` and revealed on
			 * hover/focus otherwise — then takes the touch branch and the
			 * hover/focus assertions fail in CI while passing on a developer
			 * machine. The Blink setting values are the `HoverType` /
			 * `PointerType` enums: hover = 2, fine pointer = 4.
			 */
			on("before:browser:launch", (browser, launchOptions) => {
				if (browser.family === "chromium") {
					launchOptions.args.push(
						"--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
					);
				}
				return launchOptions;
			});
		},
	},
});
