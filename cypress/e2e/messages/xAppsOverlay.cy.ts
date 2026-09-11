// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("xApps Overlay", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
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
 * Test strategy: in the Cypress environment, postMessages sent from the test page
 * carry origin "http://localhost:8787". Setting the xApp URL to that same origin
 * lets us exercise the acceptance path; using a different URL origin exercises the
 * rejection path. Both cases are observable via the closeOnSubmit behaviour.
 */
describe("postMessage origin validation (WCH-SI10-004)", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("closes overlay when postMessage origin exactly matches the xApp URL origin", () => {
		// xApp URL uses localhost:8787 — the same origin as the Cypress test runner —
		// so postMessages dispatched from the test page have a matching origin.
		cy.receiveMessage(null, {
			_cognigy: {
				_app: {
					overlaySettings: {
						autoOpen: true,
						closeOnSubmit: true,
						feedbackMessage: "",
						screenTitle: "Local xApp",
						sendEventOnCloseIconClick: false,
						showCloseIcon: false,
					},
					url: "http://localhost:8787/xapp-test",
				},
			},
		});

		cy.get(".webchat-header-logo-name-container").contains("Local xApp");

		// postMessage from the test page — event.origin will be "http://localhost:8787".
		// new URL("http://localhost:8787/xapp-test").origin === "http://localhost:8787" → accepted.
		cy.window().then(win => {
			win.postMessage({ type: "x-app-submit", success: true }, "*");
		});

		// closeOnSubmit is true and origin matched → overlay must close.
		cy.get(".webchat-header-logo-name-container").should("not.contain", "Local xApp");
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

	it("ignores postMessage with a non-xapp-submit type even from a matching origin", () => {
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
					url: "http://localhost:8787/xapp-test",
				},
			},
		});

		cy.get(".webchat-header-logo-name-container").contains("Type-check xApp");

		// Origin matches but type is wrong — overlay must stay open.
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
