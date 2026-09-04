/**
 * Focus orchestration of the chat window as a whole (WCAG 2.2 AA):
 *
 * - SC 2.4.3 Focus Order: opening the widget moves focus into the window and
 *   every close path (header close, minimize, home screen close) returns it to
 *   the toggle button, so keyboard users never land on <body>.
 * - SC 2.1.2 No Keyboard Trap / 2.4.3: the opt-in `widgetSettings.enableFocusTrap`
 *   wraps Tab / Shift+Tab at the window's boundaries (and from the toggle
 *   button), while the default keeps the host page reachable.
 *
 * Screen-specific focus behaviour lives with its feature spec (homeScreen,
 * chatOptionsScreen, prevConvesations, rating, reconnection, privacyNotice).
 */

describe("Focus management (WCAG 2.2 AA)", () => {
	// cypress-real-events dispatches real key events over CDP — Chromium only. The
	// Firefox run keeps every assertion that does not need a native Tab key.
	const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;

	const TOGGLE = "#webchatWindowToggleButton";

	// Mirrors getKeyboardFocusableElements (src/webchat-ui/utils/find-focusable.ts):
	// WebchatUI.handleKeydown wraps between the first and last of exactly these.
	const FOCUSABLE_SELECTOR =
		'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])';

	const getWindowFocusables = () =>
		cy
			.get("#webchatWindow")
			.then($window =>
				Array.from($window[0].querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
					el =>
						!el.hasAttribute("disabled") &&
						el.getAttribute("aria-hidden") !== "true" &&
						!el.closest("[inert]"),
				),
			);

	beforeEach(() => {
		cy.visitWebchat();
	});

	describe("Opening and closing the chat window (SC 2.4.3 Focus Order)", () => {
		it("moves focus into the home screen when the toggle button opens the widget", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: true } } });
			cy.get(TOGGLE).click();
			cy.get(".webchat-homescreen-content").should("be.visible");
			// the home screen's focus-first-on-open lands on its close button (CGY-3276)
			cy.focused().should("have.class", "webchat-homescreen-close-button");
		});

		it("moves focus to the message input when the toggle button opens onto the chat screen", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: false } } });
			cy.get(TOGGLE).click();
			cy.get(".webchat-input-message-input").should("be.focused");
		});

		it("returns focus to the toggle button when the header close button closes the chat", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: false } } });
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.focused");

			cy.get(".webchat-header-close-button").click();
			cy.get("#webchatWindow").should("not.exist");
			cy.focused().should("have.id", "webchatWindowToggleButton");
		});

		it("returns focus to the toggle button when the chat is minimized", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: false } } });
			cy.openWebchat().startConversation();
			cy.get(".webchat-input-message-input").should("be.focused");

			cy.get(".webchat-header-minimize-button").click();
			cy.get("#webchatWindow").should("not.exist");
			cy.focused().should("have.id", "webchatWindowToggleButton");
		});

		it("returns focus to the toggle button when the home screen is closed", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: true } } });
			cy.get(TOGGLE).click();
			cy.focused().should("have.class", "webchat-homescreen-close-button");

			cy.get(".webchat-homescreen-close-button").click();
			cy.get("#webchatWindow").should("not.exist");
			cy.focused().should("have.id", "webchatWindowToggleButton");
		});

		it("reopening after minimize moves focus back into the window", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: false } } });
			cy.get(TOGGLE).click();
			cy.get(".webchat-input-message-input").should("be.focused");

			cy.get(".webchat-header-minimize-button").click();
			cy.focused().should("have.id", "webchatWindowToggleButton");

			cy.get(TOGGLE).click();
			cy.get(".webchat-input-message-input").should("be.focused");
		});
	});

	describe("Focus trap — widgetSettings.enableFocusTrap (SC 2.1.2 / 2.4.3)", () => {
		itChromiumOnly(
			"wraps Tab from the last and Shift+Tab from the first focusable element (chat screen)",
			() => {
				cy.initMockWebchat({
					settings: {
						homeScreen: { enabled: false },
						widgetSettings: { enableFocusTrap: true },
					},
				});
				cy.openWebchat().startConversation();
				cy.get(".webchat-input-message-input").should("be.focused");

				getWindowFocusables().then(focusables => {
					expect(focusables.length, "focusable elements in the window").to.be.greaterThan(
						1,
					);
					const first = focusables[0];
					const last = focusables[focusables.length - 1];

					cy.wrap(last).focus();
					cy.realPress("Tab");
					cy.focused().should($el => expect($el[0], "wrapped to first").to.equal(first));

					cy.realPress(["Shift", "Tab"]);
					cy.focused().should($el => expect($el[0], "wrapped to last").to.equal(last));
				});
			},
		);

		itChromiumOnly("wraps Tab from the last focusable element (home screen)", () => {
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: true },
					widgetSettings: { enableFocusTrap: true },
				},
			});
			cy.openWebchat();
			cy.get(".webchat-homescreen-content").should("be.visible");
			cy.focused().should("have.class", "webchat-homescreen-close-button");

			getWindowFocusables().then(focusables => {
				const first = focusables[0];
				const last = focusables[focusables.length - 1];

				cy.wrap(last).focus();
				cy.realPress("Tab");
				cy.focused().should($el => expect($el[0], "wrapped to first").to.equal(first));
			});
		});

		itChromiumOnly(
			"Tab / Shift+Tab from the toggle button enter the window at its first / last element",
			() => {
				cy.initMockWebchat({
					settings: {
						homeScreen: { enabled: false },
						widgetSettings: { enableFocusTrap: true },
					},
				});
				cy.openWebchat().startConversation();
				cy.get(".webchat-input-message-input").should("be.focused");

				getWindowFocusables().then(focusables => {
					const first = focusables[0];
					const last = focusables[focusables.length - 1];

					cy.get(TOGGLE).focus();
					cy.realPress("Tab");
					cy.focused().should($el => expect($el[0], "first focusable").to.equal(first));

					cy.get(TOGGLE).focus();
					cy.realPress(["Shift", "Tab"]);
					cy.focused().should($el => expect($el[0], "last focusable").to.equal(last));
				});
			},
		);

		itChromiumOnly(
			"without the trap, Tab from the last element leaves the window (no keyboard trap by default)",
			() => {
				cy.initMockWebchat({ settings: { homeScreen: { enabled: false } } });
				cy.openWebchat().startConversation();
				cy.get(".webchat-input-message-input").should("be.focused");

				getWindowFocusables().then(focusables => {
					cy.wrap(focusables[focusables.length - 1]).focus();
					cy.realPress("Tab");
					cy.document().then(doc => {
						const windowEl = doc.querySelector("#webchatWindow");
						const active = doc.activeElement;
						expect(
							!active || active === doc.body || !windowEl?.contains(active),
							"focus left the chat window",
						).to.equal(true);
					});
				});
			},
		);
	});
});
