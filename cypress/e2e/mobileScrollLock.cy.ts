// Verifies the `widgetSettings.disableMobileScrollLock` opt-out (AZ 138678).
// When the webchat is open on a mobile viewport it locks scrolling of the host
// page via react-remove-scroll, which sets `data-scroll-locked` on <body>.
// The flag must disable that lock, and must react to runtime updateSettings().

const MOBILE = [375, 700] as const;
const DESKTOP = [1280, 900] as const;

describe("Mobile scroll lock (disableMobileScrollLock)", () => {
	it("locks host-page scroll on mobile when open (default behavior)", () => {
		cy.viewport(...MOBILE);
		cy.visitWebchat().initMockWebchat();
		cy.openWebchat();

		cy.get("[data-cognigy-webchat]").should("exist");
		cy.get("body").should("have.attr", "data-scroll-locked");
	});

	it("does NOT lock host-page scroll when disableMobileScrollLock is true", () => {
		cy.viewport(...MOBILE);
		cy.visitWebchat().initMockWebchat({
			settings: { widgetSettings: { disableMobileScrollLock: true } },
		});
		cy.openWebchat();

		cy.get("[data-cognigy-webchat]").should("exist");
		cy.get("body").should("not.have.attr", "data-scroll-locked");
	});

	it("never locks on a desktop viewport regardless of the flag", () => {
		cy.viewport(...DESKTOP);
		cy.visitWebchat().initMockWebchat();
		cy.openWebchat();

		cy.get("[data-cognigy-webchat]").should("exist");
		cy.get("body").should("not.have.attr", "data-scroll-locked");
	});

	it("reacts to updateSettings() at runtime without a reload", () => {
		cy.viewport(...MOBILE);
		cy.visitWebchat().initMockWebchat();
		cy.openWebchat();

		// locked by default
		cy.get("body").should("have.attr", "data-scroll-locked");

		// flip the flag on -> lock released live
		cy.updateSettings({ widgetSettings: { disableMobileScrollLock: true } });
		cy.get("body").should("not.have.attr", "data-scroll-locked");

		// flip it back off -> lock re-applied live
		cy.updateSettings({ widgetSettings: { disableMobileScrollLock: false } });
		cy.get("body").should("have.attr", "data-scroll-locked");
	});
});
