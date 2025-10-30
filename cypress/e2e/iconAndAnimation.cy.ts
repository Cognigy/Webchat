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
});


