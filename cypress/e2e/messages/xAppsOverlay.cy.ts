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

		it("xApp iframe allow= list does not contain high-risk device APIs", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.get("iframe")
					.invoke("attr", "allow")
					.should("not.include", "payment")
					.and("not.include", "usb")
					.and("not.include", "bluetooth")
					.and("not.include", "serial")
					.and("not.include", "hid")
					.and("not.include", "xr-spatial-tracking");
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

		it("does not render iframe for a same-origin xApp URL to prevent sandbox escape", () => {
			// allow-scripts + allow-same-origin together allow a same-origin iframe to
			// remove its own sandbox via frameElement; reject same-origin URLs at render time.
			cy.receiveMessage(null, {
				_cognigy: {
					_app: {
						overlaySettings: {},
						url: "http://localhost:8787/same-origin-xapp",
					},
				},
			});
			cy.get("iframe").should("not.exist");
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

/**
 * WCH-SI10-004 — Cross-frame origin check fix.
 *
 * The previous check `url.startsWith(event.origin)` compared the raw URL string
 * against the sender origin, which is semantically backwards. A domain that is a
 * string-prefix of the configured xApp URL (e.g. "https://xapp.cognigy.a" for
 * "https://xapp.cognigy.ai/form") could pass the check despite being a completely
 * different origin.
 *
 * The fix uses `new URL(url).origin === event.origin` which compares the canonical
 * scheme+host+port extracted from both sides — the correct cross-origin boundary.
 *
 * Test strategy: WCH-SI10-003 rejects same-origin xApp URLs, so localhost-based
 * xApp URLs can no longer be used to exercise the postMessage acceptance path in
 * Cypress (the component returns null before rendering). The rejection path is
 * covered below using a cross-origin URL (https://example.com).
 */
describe("postMessage origin validation (WCH-SI10-004)", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("keeps overlay open when postMessage origin does not match the xApp URL origin", () => {
		// xApp URL at https://example.com — the test-runner origin (http://localhost:8787)
		// is a different origin, so the postMessage must be rejected.
		cy.receiveMessage(null, {
			_cognigy: {
				_app: {
					overlaySettings: {
						autoOpen: true,
						closeOnSubmit: true, // would close if origin matched
						feedbackMessage: "",
						screenTitle: "External xApp",
						sendEventOnCloseIconClick: false,
						showCloseIcon: true,
					},
					url: "https://example.com/xapp-form",
				},
			},
		});

		cy.get(".webchat-header-logo-name-container").contains("External xApp");

		// postMessage from the test page — event.origin = "http://localhost:8787".
		// new URL("https://example.com/xapp-form").origin = "https://example.com" → mismatch → rejected.
		cy.window().then(win => {
			win.postMessage({ type: "x-app-submit", success: true }, "*");
		});

		// Allow the (rejected) handler to run, then confirm overlay is still open.
		cy.wait(500);
		cy.get(".webchat-header-logo-name-container").should("contain", "External xApp");
	});

	it("ignores postMessage with an unrecognised type from a non-matching origin", () => {
		// xApp at https://example.com; test runner is http://localhost:8787.
		// Both origin mismatch AND wrong type — overlay must stay open.
		cy.receiveMessage(null, {
			_cognigy: {
				_app: {
					overlaySettings: {
						autoOpen: true,
						closeOnSubmit: true,
						feedbackMessage: "",
						screenTitle: "Type-check xApp",
						sendEventOnCloseIconClick: false,
						showCloseIcon: true,
					},
					url: "https://example.com/xapp-form",
				},
			},
		});

		cy.get(".webchat-header-logo-name-container").contains("Type-check xApp");

		cy.window().then(win => {
			win.postMessage({ type: "some-other-event", payload: "data" }, "*");
		});

		cy.wait(500);
		cy.get(".webchat-header-logo-name-container").should("contain", "Type-check xApp");
	});
});

describe("Accessibility (WCAG 2.2 AA)", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("xApps overlay passes axe audit", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
