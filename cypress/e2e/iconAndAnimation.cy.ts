import { itChromiumOnly } from "../support/browser";

describe("Launcher icon and animation", () => {
	it("renders default SVG icon with correct burst duration (1s)", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					layout: {
						// no iconUrl -> default-1
						iconAnimation: "bounce",
						// default speed => 1 / 1 = 1s
					},
				},
			})
			.get("#webchatWindowToggleButton .iconAnimationContainer")
			.should("exist")
			.should($el => {
				// default icon renders as an inline SVG element
				expect($el[0].tagName.toLowerCase()).to.equal("svg");
				// ChatIcon sets the CSS variable inline
				expect(($el[0] as HTMLElement).getAttribute("style") || "").to.contain(
					"--icon-burst-duration: 1s",
				);
			});
	});

	it("renders data-URI SVG icon as masked span", () => {
		const svgDataUri =
			"data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%270 0 20 20%27/%3E";

		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					layout: {
						iconUrl: svgDataUri,
						iconAnimation: "bounce",
						iconAnimationSpeed: 2,
					},
				},
			})
			.get("#webchatWindowToggleButton .iconAnimationContainer")
			.should("exist")
			.should($el => {
				// masked SVG renders as a styled span
				expect($el[0].tagName.toLowerCase()).to.equal("span");
				// 1 / 2 = 0.5s, clamped to >= 0.2s => 0.5s
				expect(($el[0] as HTMLElement).getAttribute("style") || "").to.contain(
					"--icon-burst-duration: 0.5s",
				);
			});
	});

	it("renders data-URI PNG icon as <img> with class and duration", () => {
		// 1x1 transparent pixel
		const pngDataUri =
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/XPc1VUAAAAASUVORK5CYII=";

		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					layout: {
						iconUrl: pngDataUri,
						iconAnimation: "bounce",
						iconAnimationSpeed: 10, // 1/10 = 0.1s -> clamped to 0.2s
					},
				},
			})
			.get("#webchatWindowToggleButton .iconAnimationContainer")
			.should("exist")
			.should($el => {
				expect($el[0].tagName.toLowerCase()).to.equal("img");
				expect(($el[0] as HTMLImageElement).src).to.contain("data:image/png");
				expect(($el[0] as HTMLElement).getAttribute("style") || "").to.contain(
					"--icon-burst-duration: 0.2s",
				);
			});
	});

	it("applies animation class and toggles optionActive class on interval", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					layout: {
						iconAnimation: "bounce",
						iconAnimationInterval: 1,
						iconAnimationSpeed: 1,
					},
				},
			})
			.get("#webchatWindowToggleButton .iconAnimationContainer")
			.should("have.class", "bounce")
			.wait(1200)
			.should($el => {
				// interval code toggles the class on the icon element
				expect($el).to.have.class("optionActive");
			});
	});

	describe("Pause control (WCAG 2.2.2 Pause, Stop, Hide — CGY-39786)", () => {
		const TOGGLE = "#webchatWindowToggleButton";
		const PAUSE = "#webchatIconAnimationPauseButton";
		// Opt-in: existing embeddings with an animation see no change unless
		// they set enableIconAnimationPauseButton
		const animatedSettings = {
			layout: {
				iconAnimation: "bounce",
				iconAnimationInterval: 1,
				iconAnimationSpeed: 1,
				enableIconAnimationPauseButton: true,
			},
		};

		it("renders a native button next to the launcher when enabled and an animation is configured", () => {
			cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
			cy.get(PAUSE)
				.should("match", "button")
				.and("have.attr", "type", "button")
				.and("have.attr", "aria-label", "Pause webchat toggle animation")
				.and("not.have.attr", "aria-pressed");
			// 24x24 CSS px pointer target (SC 2.5.8)
			cy.get(PAUSE).should($el => {
				const { width, height } = $el[0].getBoundingClientRect();
				expect(width).to.be.at.least(24);
				expect(height).to.be.at.least(24);
			});
			// Tab order: launcher first, then its secondary control
			cy.get(TOGGLE).next(PAUSE).should("exist");
		});

		it("is not rendered unless the embedding opts in, and never without an animation", () => {
			// Default (opt-out): an animated launcher looks exactly as before
			cy.visitWebchat().initMockWebchat({
				settings: {
					layout: { iconAnimation: "bounce", iconAnimationInterval: 1 },
				},
			});
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("have.class", "bounce");
			cy.get(PAUSE).should("not.exist");

			// Opted in, but nothing to pause
			cy.visitWebchat().initMockWebchat({
				settings: { layout: { enableIconAnimationPauseButton: true } },
			});
			cy.get(TOGGLE).should("exist");
			cy.get(PAUSE).should("not.exist");

			cy.visitWebchat().initMockWebchat({
				settings: {
					layout: { enableIconAnimationPauseButton: true, iconAnimation: "none" },
				},
			});
			cy.get(TOGGLE).should("exist");
			cy.get(PAUSE).should("not.exist");
		});

		it("pausing stops the interval from replaying the burst; resuming starts it again", () => {
			cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("have.class", "optionActive");

			cy.get(PAUSE).click();
			// The name states the next action, matching the icon (pause ⇄ play)
			cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");
			// A burst in progress is cut short …
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("not.have.class", "optionActive");
			// … and no new one starts after the 1s interval
			cy.wait(1500);
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("not.have.class", "optionActive");

			cy.get(PAUSE).click();
			cy.get(PAUSE).should("have.attr", "aria-label", "Pause webchat toggle animation");
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("have.class", "optionActive");
		});

		it("remembers the paused state across page loads", () => {
			cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
			cy.get(PAUSE).click();
			cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");

			cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
			cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");
			cy.wait(1500);
			cy.get(`${TOGGLE} .iconAnimationContainer`).should("not.have.class", "optionActive");
		});

		it("does not persist the choice when browser storage is disabled", () => {
			const settings = {
				...animatedSettings,
				embeddingConfiguration: { disableLocalStorage: true },
			};
			cy.visitWebchat().initMockWebchat({ settings });
			cy.get(PAUSE).click();
			cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");
			cy.window().then(win => {
				expect(win.localStorage.getItem("cognigy-webchat-icon-animation-paused")).to.equal(
					null,
				);
			});

			cy.visitWebchat().initMockWebchat({ settings });
			cy.get(PAUSE).should("have.attr", "aria-label", "Pause webchat toggle animation");
		});

		it("is not rendered while the chat window is open", () => {
			cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
			cy.get(PAUSE).should("exist");
			cy.openWebchat();
			cy.get("#webchatWindow").should("exist");
			cy.get(PAUSE).should("not.exist");
			cy.get(TOGGLE).click();
			cy.get(PAUSE).should("exist");
		});

		itChromiumOnly(
			"is revealed while the launcher is hovered or holds focus and stays focusable meanwhile",
			() => {
				cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
				// Fine pointer: hidden until hover/focus, but always in the DOM
				cy.get(PAUSE).should("have.css", "opacity", "0");

				cy.get(TOGGLE).realHover();
				cy.get(PAUSE).should("have.css", "opacity", "1");
				cy.get("body").realHover({ position: "topLeft" });
				cy.get(PAUSE).should("have.css", "opacity", "0");

				// Keyboard: focusing the launcher reveals it (focus-within), the
				// next Tab reaches it and it stays visible while focused
				cy.get(TOGGLE).focus();
				cy.get(PAUSE).should("have.css", "opacity", "1");
				cy.realPress("Tab");
				cy.get(PAUSE).should("have.focus").and("have.css", "opacity", "1");
				cy.realPress("Space");
				cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");
			},
		);

		itChromiumOnly(
			"is hidden and the animation is suppressed under prefers-reduced-motion: reduce",
			() => {
				cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
				cy.get(PAUSE).should("exist");
				cy.then(() =>
					Cypress.automation("remote:debugger:protocol", {
						command: "Emulation.setEmulatedMedia",
						params: { features: [{ name: "prefers-reduced-motion", value: "reduce" }] },
					}),
				);
				cy.get(PAUSE).should("not.be.visible");
				cy.get(`${TOGGLE} .iconAnimationContainer`)
					.should("have.class", "optionActive")
					.and("have.css", "animation-name", "none");
				cy.then(() =>
					Cypress.automation("remote:debugger:protocol", {
						command: "Emulation.setEmulatedMedia",
						params: { features: [{ name: "prefers-reduced-motion", value: "" }] },
					}),
				);
			},
		);

		it("honors the configurable pause/resume aria labels", () => {
			cy.visitWebchat().initMockWebchat({
				settings: {
					...animatedSettings,
					customTranslations: {
						ariaLabels: {
							pauseWebchatToggleAnimation: "Animation anhalten",
							resumeWebchatToggleAnimation: "Animation fortsetzen",
						},
					},
				},
			});
			cy.get(PAUSE).should("have.attr", "aria-label", "Animation anhalten");
			cy.get(PAUSE).click();
			cy.get(PAUSE).should("have.attr", "aria-label", "Animation fortsetzen");
		});

		describe("Accessibility (WCAG 2.2 AA)", () => {
			it("animated launcher with its pause control has no detectable a11y violations", () => {
				cy.visitWebchat().initMockWebchat({ settings: animatedSettings });
				cy.get(PAUSE).should("exist");
				cy.checkA11yCompliance("[data-cognigy-webchat-root]");
				cy.get(PAUSE).click();
				cy.get(PAUSE).should("have.attr", "aria-label", "Resume webchat toggle animation");
				cy.checkA11yCompliance("[data-cognigy-webchat-root]");
			});
		});
	});
});
