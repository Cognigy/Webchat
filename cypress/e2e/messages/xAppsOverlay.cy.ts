// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("xApps Overlay", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	describe("Security (WCH-SI10-003)", () => {
		it("xApp iframe has sandbox attribute restricting default capabilities", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.get("iframe").should("have.attr", "sandbox");
				cy.get("iframe")
					.invoke("attr", "sandbox")
					.should("include", "allow-scripts")
					.and("include", "allow-same-origin")
					.and("include", "allow-forms")
					.and("include", "allow-popups")
					.and("not.include", "allow-top-navigation");
			});
		});

		it("xApp iframe sandbox includes allow-modals so alert/confirm/prompt work", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.get("iframe")
					.invoke("attr", "sandbox")
					.should("include", "allow-modals")
					.and("not.include", "allow-top-navigation");
			});
		});
	});

	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("xApps overlay passes axe audit", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.checkA11yCompliance("[data-cognigy-webchat-root]");
			});
		});
	});

	it("opens overlay automatically", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.get(".webchat-header-logo-name-container").contains("XApp Title 1");
		});
	});

	it("closes overlay on close-button click", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.get(".webchat-header-close-button").click();
		});
	});

	it("changes title on switching apps", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.wait(1000);
			cy.receiveMessage(null, {
				_cognigy: {
					_app: {
						overlaySettings: {
							screenTitle: "XApp Title 2",
						},
						url: "https://example.com",
					},
				},
			});
			cy.get(".webchat-header-logo-name-container").contains("XApp Title 2");
		});
	});

	it("makes xApp fullscreen when no title and no close icon", () => {
		cy.withMessageFixture("xApps-overlay-noClose", () => {
			cy.get(".webchat-header-bar").should("not.exist");
		});
	});
});
