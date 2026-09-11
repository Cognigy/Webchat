// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("xApps Overlay", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	describe("Security (WCH-SI10-003)", () => {
		it("xApp iframe has sandbox attribute with required tokens", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.get("iframe").should("have.attr", "sandbox");
				// Regex anchor prevents "allow-top-navigation-by-user-activation" matching
				// the "not.include" for bare "allow-top-navigation".
				cy.get("iframe")
					.invoke("attr", "sandbox")
					.should("include", "allow-scripts")
					.and("include", "allow-forms")
					.and("include", "allow-popups")
					.and("include", "allow-popups-to-escape-sandbox")
					.and("include", "allow-modals")
					.and("include", "allow-downloads")
					.and("include", "allow-top-navigation-by-user-activation")
					.and("not.match", /(?:^|\s)allow-top-navigation(?:\s|$)/);
			});
		});

		it("xApp iframe allow= includes payment and auth, excludes high-risk device APIs", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				// payment, publickey-credentials-get, otp-credentials required for documented
				// xApp use cases (Stripe payment, WebAuthn/biometric auth, SMS OTP).
				cy.get("iframe")
					.invoke("attr", "allow")
					.should("include", "payment")
					.and("include", "publickey-credentials-get")
					.and("include", "otp-credentials")
					.and("not.include", "usb")
					.and("not.include", "bluetooth")
					.and("not.include", "serial")
					.and("not.include", "hid")
					.and("not.include", "xr-spatial-tracking");
			});
		});

		it("omits allow-same-origin for same-origin xApp URLs to prevent sandbox escape", () => {
			// allow-scripts + allow-same-origin together allow a same-origin iframe to
			// remove its own sandbox via frameElement. For same-origin URLs, allow-same-origin
			// is dropped so the frame is treated as cross-origin within the sandbox.
			// autoOpen:true is required — the reducer only opens when explicitly set.
			cy.receiveMessage(null, {
				_cognigy: {
					_app: {
						overlaySettings: {
							autoOpen: true,
							screenTitle: "Same-Origin xApp",
							showCloseIcon: true,
						},
						url: "http://localhost:8787/same-origin-xapp",
					},
				},
			});
			// The overlay renders (not dead-ended), but without allow-same-origin
			cy.get(".webchat-header-logo-name-container").contains("Same-Origin xApp");
			cy.get("iframe").should("have.attr", "sandbox").and("not.include", "allow-same-origin");
		});

		it("cross-origin xApp URL includes allow-same-origin in sandbox", () => {
			cy.withMessageFixture("xApps-overlay-autoOpen", () => {
				cy.get("iframe").invoke("attr", "sandbox").should("include", "allow-same-origin");
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
 * Cypress (the component omits allow-same-origin for those URLs, making origin
 * matching irrelevant for the sandbox escape path). The rejection path is
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
