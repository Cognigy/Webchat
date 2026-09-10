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
			cy.get("[data-xapp-overlay]").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});

	it("xApps overlay without title and close icon passes axe audit", () => {
		cy.withMessageFixture("xApps-overlay-noClose", () => {
			cy.get("[data-xapp-overlay]").should("exist");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});

	it("is a modal dialog named by its visible title, with a titled frame (SC 4.1.2)", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.get("[data-xapp-overlay]")
				.should("have.attr", "role", "dialog")
				.should("have.attr", "aria-modal", "true")
				.should("have.attr", "aria-labelledby", "webchatXAppOverlayTitle")
				// A non-interactive container must not be a tab stop
				.should("not.have.attr", "tabindex");
			cy.get("#webchatXAppOverlayTitle").should("have.text", "XApp Title 1");
			cy.get("[data-xapp-overlay] iframe").should("have.attr", "title", "XApp Title 1");
			// The close icon closes the app, not the chat
			cy.get("[data-xapp-overlay] .webchat-header-close-button").should(
				"have.attr",
				"aria-label",
				"Close dialog",
			);
		});
	});

	it("falls back to a configurable name when the xApp has no screen title", () => {
		cy.withMessageFixture("xApps-overlay-noClose", () => {
			cy.get("[data-xapp-overlay]")
				.should("have.attr", "aria-label", "Embedded app")
				.should("not.have.attr", "aria-labelledby");
			cy.get("[data-xapp-overlay] iframe").should("have.attr", "title", "Embedded app");
		});
	});

	it("uses the xAppOverlay aria-label translation", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					customTranslations: {
						ariaLabels: {
							xAppOverlay: "Eingebettete App",
							closeDialog: "Dialog schließen",
						},
					},
				},
			})
			.openWebchat()
			.startConversation();
		cy.receiveMessage(null, {
			_cognigy: {
				_app: {
					overlaySettings: { autoOpen: true, screenTitle: "", showCloseIcon: true },
					url: "https://example.com",
				},
			},
		});
		cy.get("[data-xapp-overlay]").should("have.attr", "aria-label", "Eingebettete App");
		cy.get("[data-xapp-overlay] iframe").should("have.attr", "title", "Eingebettete App");
		cy.get("[data-xapp-overlay] .webchat-header-close-button").should(
			"have.attr",
			"aria-label",
			"Dialog schließen",
		);
	});

	it("renders no empty heading when a close icon is shown without a title", () => {
		cy.receiveMessage(null, {
			_cognigy: {
				_app: {
					overlaySettings: { autoOpen: true, screenTitle: "", showCloseIcon: true },
					url: "https://example.com",
				},
			},
		});
		cy.get("[data-xapp-overlay] .webchat-header-close-button").should("exist");
		cy.get("[data-xapp-overlay] .webchat-header-title").should("not.exist");
		cy.get("[data-xapp-overlay] h2").should("not.exist");
		cy.checkA11yCompliance("[data-cognigy-webchat-root]");
	});

	it("moves focus to the close button on open and traps Tab inside the dialog (SC 2.4.3, 2.1.2)", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			// Deferred focus on the first control, so screen readers announce
			// the dialog name once and then the button — not the title heading,
			// which would repeat the dialog name
			cy.get("[data-xapp-overlay] .webchat-header-close-button").should("have.focus");
			cy.get("#webchatXAppOverlayTitle").should("not.have.focus");

			// Forward tab order: close button → frame
			cy.realPress("Tab");
			cy.get("[data-xapp-overlay] iframe").should("have.focus");

			// Shift+Tab off the first control lands on the start guard, which
			// wraps to the last tab stop (the frame) instead of the host page
			cy.get("[data-xapp-overlay] .webchat-header-close-button").focus();
			cy.realPress(["Shift", "Tab"]);
			cy.get("[data-xapp-overlay] iframe").should("have.focus");

			// Tabbing out of the frame lands on the end guard, which wraps to
			// the first control (keydown inside the frame is invisible here,
			// so the guard is exercised directly)
			cy.get("[data-xapp-overlay-focus-guard='end']").focus();
			cy.get("[data-xapp-overlay] .webchat-header-close-button").should("have.focus");
		});
	});

	it("focuses the frame on open when the xApp has neither title nor close icon", () => {
		cy.withMessageFixture("xApps-overlay-noClose", () => {
			cy.get("[data-xapp-overlay] iframe").should("have.focus");
		});
	});

	it("closes on Escape when a close icon is shown and focus returns to the chat input", () => {
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.get("[data-xapp-overlay] .webchat-header-close-button").should("have.focus");
			cy.realPress("Escape");
			cy.get("[data-xapp-overlay]").should("not.exist");
			cy.get(".webchat-input-message-input").should("have.focus");
		});
	});

	it("ignores Escape when the xApp has no close icon", () => {
		cy.withMessageFixture("xApps-overlay-noClose", () => {
			cy.get("[data-xapp-overlay]").should("exist");
			cy.get("body").trigger("keydown", { key: "Escape" });
			cy.wait(300);
			cy.get("[data-xapp-overlay]").should("exist");
		});
	});

	it("moves focus to the header title on close when input autofocus is disabled", () => {
		cy.visitWebchat()
			.initMockWebchat({ settings: { widgetSettings: { disableInputAutofocus: true } } })
			.openWebchat()
			.startConversation();
		cy.withMessageFixture("xApps-overlay-autoOpen", () => {
			cy.get("[data-xapp-overlay] .webchat-header-close-button").should("have.focus").click();
			cy.get("[data-xapp-overlay]").should("not.exist");
			cy.get(".webchat-header-bar .webchat-header-title").should("have.focus");
		});
	});
});
