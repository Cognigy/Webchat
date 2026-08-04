const goOffline = () => {
	cy.log("**go offline**")
		.then(() => {
			return Cypress.automation("remote:debugger:protocol", {
				command: "Network.enable",
			});
		})
		.then(() => {
			return Cypress.automation("remote:debugger:protocol", {
				command: "Network.emulateNetworkConditions",
				params: {
					offline: true,
					latency: -1,
					downloadThroughput: -1,
					uploadThroughput: -1,
				},
			});
		});
};

const goOnline = () => {
	// disable offline mode, otherwise we will break our tests :)
	cy.log("**go online**")
		.then(() => {
			// https://chromedevtools.github.io/devtools-protocol/1-3/Network/#method-emulateNetworkConditions
			return Cypress.automation("remote:debugger:protocol", {
				command: "Network.emulateNetworkConditions",
				params: {
					offline: false,
					latency: -1,
					downloadThroughput: -1,
					uploadThroughput: -1,
				},
			});
		})
		.then(() => {
			return Cypress.automation("remote:debugger:protocol", {
				command: "Network.disable",
			});
		});
};

const assertOnline = () => {
	return cy.wrap(window).its("navigator.onLine").should("be.true");
};

const assertOffline = () => {
	return cy.wrap(window).its("navigator.onLine").should("be.false");
};

// remote:debugger:protocol is not supported in Firefox
describe("Reconnection", { browser: "!firefox" }, () => {
	beforeEach(() => {
		goOnline();
		cy.visit("/webchat.test.html");
	});

	afterEach(goOnline);

	it("should send the messages after network reconnection", () => {
		cy.initWebchat({
			settings: {
				homeScreen: {
					enabled: true,
					previousConversations: {
						enabled: true,
						buttonText: "View previous conversations",
					},
				},
				behavior: {
					enableConnectionStatusIndicator: false,
				},
			},
		});

		// Open Webchat to establish a connection
		cy.openWebchat();
		cy.startConversation();

		// Wait until a stable connection is established before going offline
		cy.waitUntil(() =>
			cy.get(".webchat-chat-history").contains("You're now chatting with an AI Agent."),
		);
		// Go offline
		goOffline();

		assertOffline();

		// Send a message
		cy.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type("Hi");
			})
			.get('[aria-label="Send message"]')
			.click()
			.get(".webchat-chat-history")
			.contains("Hi");

		// Wait for the reconnection
		goOnline();
		assertOnline();

		cy.get(".webchat-chat-history").contains('You said "Hi".');
	});
});

/**
 * WCAG 2.2 AA coverage for the disconnect (connection-lost) overlay
 * (CGY-3269, CGY-3271, CGY-3885).
 *
 * The mock endpoint never opens a real socket, so the connection state is
 * driven through the store (same pattern as closeButtonAnalytics.cy.ts).
 */
describe("Accessibility (WCAG 2.2 AA)", () => {
	const setConnected = (connected: boolean) =>
		cy.getWebchat().then((webchat: any) => {
			webchat.store.dispatch({ type: "SET_CONNECTED", connected });
		});

	const setReconnectionLimit = (reconnectionLimit: boolean) =>
		cy.getWebchat().then((webchat: any) => {
			webchat.store.dispatch({ type: "SET_RECONNECTION_LIMIT", reconnectionLimit });
		});

	/**
	 * Render the overlay by connecting then dropping. `hadConnection` (WebchatUI
	 * state) latches asynchronously on the first connect and never resets, so
	 * retry the connect/drop until the overlay actually renders.
	 */
	const showDisconnectOverlayViaDrop = (attempt = 0) => {
		setConnected(true);
		cy.wait(50); // let react-redux commit the connect so hadConnection can latch
		setConnected(false);
		cy.get("body").then($body => {
			const shown = $body.find("[data-disconnect-overlay]").length > 0;
			if (!shown && attempt < 20) {
				showDisconnectOverlayViaDrop(attempt + 1);
			}
		});
	};

	const openChatWithOverlay = () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: { behavior: { enableConnectionStatusIndicator: true } },
			})
			.openWebchat()
			.startConversation();
		showDisconnectOverlayViaDrop();
		cy.get("[data-disconnect-overlay]").should("be.visible");
	};

	it("renders the overlay as a modal dialog with an accessible name", () => {
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay]")
			.should("have.attr", "role", "dialog")
			.should("have.attr", "aria-modal", "true")
			.should("have.attr", "aria-labelledby", "webchatDisconnectOverlayTitle");
		cy.get("#webchatDisconnectOverlayTitle").should("contain.text", "Connection lost");

		cy.checkA11yCompliance("[data-cognigy-webchat-root]");
	});

	it("moves focus once to the close button on open and keeps it stable", () => {
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay-close-button]").should("have.focus");
		// Focus must not be moved again without user action (SC 3.2.1)
		cy.wait(500);
		cy.get("[data-disconnect-overlay-close-button]").should("have.focus");
	});

	it("focuses the Reconnect action when the overlay opens in the permanent state", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: { behavior: { enableConnectionStatusIndicator: true } },
			})
			.openWebchat()
			.startConversation();
		setReconnectionLimit(true);
		showDisconnectOverlayViaDrop();

		cy.contains("button", "Reconnect").should("be.visible").should("have.focus");
	});

	it("labels the close button with its real effect and closes the chat window", () => {
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay-close-button]")
			.should("have.attr", "aria-label", "Close chat window")
			.click();

		// It closes the whole webchat window, and focus returns to the toggle
		cy.get("[data-cognigy-webchat]").should("not.exist");
		cy.get("[data-cognigy-webchat-toggle]").should("have.focus");
	});

	it("hides the background chat content from assistive technologies while open", () => {
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay]")
			.parent()
			.find("[aria-hidden='true'][inert]")
			.should("exist")
			.find(".webchat-chat-history")
			.should("exist");
	});

	it("wraps keyboard focus at the overlay's boundaries (focus trap)", () => {
		openChatWithOverlay();
		setReconnectionLimit(true);

		// Two focusable controls: close (X, first) and Reconnect (last).
		// Tab on the last wraps to the first; Shift+Tab on the first wraps to
		// the last. (In-between moves are native browser tabbing, which
		// Cypress cannot synthesize.)
		cy.contains("button", "Reconnect").focus().trigger("keydown", { key: "Tab" });
		cy.get("[data-disconnect-overlay-close-button]")
			.should("have.focus")
			.trigger("keydown", { key: "Tab", shiftKey: true });
		cy.contains("button", "Reconnect").should("have.focus");
	});

	it("closes on Escape", () => {
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay-close-button]").type("{esc}");
		cy.get("[data-cognigy-webchat]").should("not.exist");
	});

	it("announces the reconnecting status when the overlay opens (SC 4.1.3)", () => {
		// The dialog announcement covers only its accessible name — VoiceOver
		// does not read the dialog body, so the status text must additionally
		// go through a live region (deferred past the dialog/focus
		// announcement). That region must live INSIDE the aria-modal dialog:
		// VoiceOver prunes the accessibility tree outside an open modal, so
		// updates to an outside region are never announced. The dialog title
		// must NOT be pushed through the region — that would double up on
		// screen readers that do read the dialog (NVDA).
		openChatWithOverlay();

		cy.get("[data-disconnect-overlay] [data-disconnect-overlay-live-region]").should(
			"contain.text",
			"Reconnecting",
		);
		cy.get("[data-disconnect-overlay-live-region]").should(
			"not.contain.text",
			"Connection lost",
		);
		// The visible status line is hidden from AT — the live region is the
		// single programmatic source. Otherwise NVDA reads the visible line in
		// each of its two dialog-entry passes plus the live region (thrice).
		cy.get(".webchat-disconnect-overlay-status").should("have.attr", "aria-hidden", "true");
	});

	it("announces the gave-up transition and moves focus to the Reconnect action", () => {
		openChatWithOverlay();
		cy.get("[data-disconnect-overlay-close-button]").should("have.focus");

		setReconnectionLimit(true);

		// Focus moves to the new primary action — deferred (so the screen
		// reader announces the freshly inserted button) and guarded: it only
		// happens while focus still sits on the overlay's close button,
		// never yanking it from a navigating user. The focus announcement
		// conveys the transition, so the live region is cleared here (no
		// double announcement — emptying a live region is not announced).
		cy.contains("button", "Reconnect").should("have.focus");
		cy.get("[data-disconnect-overlay-live-region]").should("have.text", "");
	});

	it("does not steal focus at the gave-up transition when the user is navigating", () => {
		openChatWithOverlay();
		cy.get("[data-disconnect-overlay-close-button]").should("have.focus");

		setReconnectionLimit(true);
		// The user moves focus away before the deferred move fires
		cy.get("[data-disconnect-overlay-close-button]").blur();

		cy.wait(700);
		// Focus was not moved, so the transition is announced via the live
		// region instead — exactly one announcement either way.
		cy.get("[data-disconnect-overlay-live-region]").should("have.text", "Reconnect");
		cy.contains("button", "Reconnect").should("not.have.focus");
	});

	it("shows progress and disables Reconnect while an attempt is running", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: { behavior: { enableConnectionStatusIndicator: true } },
			})
			.openWebchat()
			.startConversation();
		setReconnectionLimit(true);
		showDisconnectOverlayViaDrop();

		cy.getWebchat().then((webchat: any) => {
			webchat.store.dispatch({ type: "SET_CONNECTING", connecting: true });
		});

		cy.contains("button", "Reconnect").should("have.attr", "aria-disabled", "true");
		cy.get(".webchat-disconnect-overlay-status").should("contain.text", "Reconnecting");
	});

	it("announces a manual reconnection attempt on activation", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: { behavior: { enableConnectionStatusIndicator: true } },
			})
			.openWebchat()
			.startConversation();
		setReconnectionLimit(true);
		showDisconnectOverlayViaDrop();

		cy.getWebchat().then((webchat: any) => {
			// Keep the attempt pending forever so the announced state is
			// stable to assert, and clear any latched `connecting` flag from
			// the mock endpoint's initial CONNECT so the click is not a no-op.
			webchat.client.connect = () => new Promise(() => {});
			webchat.store.dispatch({ type: "SET_CONNECTING", connecting: false });
		});

		cy.contains("button", "Reconnect").click();

		cy.get("[data-disconnect-overlay-live-region]").should("contain.text", "Reconnecting");
	});

	it("uses the connection_restored custom translation for the restored announcement", () => {
		cy.visitWebchat()
			.initMockWebchat({
				settings: {
					behavior: { enableConnectionStatusIndicator: true },
					customTranslations: { connection_restored: "Back online!" },
				},
			})
			.openWebchat()
			.startConversation();
		showDisconnectOverlayViaDrop();
		cy.get("[data-disconnect-overlay]").should("be.visible");

		setConnected(true);

		cy.get("[data-cognigy-webchat-root] [role='status'].sr-only").should(
			"contain.text",
			"Back online!",
		);
	});

	it("announces when the connection is restored and the overlay closes", () => {
		openChatWithOverlay();

		setConnected(true);

		cy.get("[data-disconnect-overlay]").should("not.exist");
		cy.get("[data-cognigy-webchat-root] [role='status'].sr-only").should(
			"contain.text",
			"Connection restored.",
		);
	});
});
