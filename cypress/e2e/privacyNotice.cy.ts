describe("Privacy Notice", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("shows privacy notice screen when configured", () => {
		cy.initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();
		cy.get(".webchat-privacy-notice-root").should("be.visible");
		// Accessibility (WCAG 2.2 AA) — scoped to the widget root, not the bare
		// test host page. See docs/accessibility.md.
		cy.checkA11yCompliance("[data-cognigy-webchat-root]");
	});

	it("allows title customization", () => {
		cy.initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
					title: "Privacy notice 321",
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();
		cy.get(".webchat-header-title").should("have.text", "Privacy notice 321");
	});

	it("allows text customization", () => {
		cy.initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
					text: "Custom text here 123",
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();
		cy.get(".webchat-privacy-notice-message").should("have.text", "Custom text here 123");
	});

	it("allows privacy policy link text customization", () => {
		cy.initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
					urlText: "URL text here 123",
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();
		cy.get(".tertiary-button").should("have.text", "URL text here 123");
	});

	it("allows privacy policy link url customization", () => {
		cy.initMockWebchat({
			settings: {
				privacyNotice: {
					enabled: true,
					url: "https://cognigy.com",
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();

		cy.get(".tertiary-button")
			.should("have.attr", "href", "https://cognigy.com")
			.and("have.attr", "target", "_blank")
			.and("have.attr", "rel", "noopener noreferrer");
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		// cypress-real-events dispatches real key events over CDP — Chromium only.
		const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;

		const privacyNotice = {
			enabled: true,
			text: "Please read our [terms of use](https://example.com/terms) before you start.",
			urlText: "Our privacy policy",
			url: "https://example.com/policy",
		};

		it("privacy notice with a markdown link and a policy link has no detectable a11y violations", () => {
			cy.initMockWebchat({ settings: { privacyNotice } });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-privacy-notice-markdown-container a").should("be.visible");
			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		// SC 2.4.3: the notice has no natural focus target, so the header title
		// takes focus (autoFocusScreenTitle) and announces the screen change.
		it("moves focus to the screen title when the notice appears after the home screen", () => {
			cy.initMockWebchat({ settings: { privacyNotice } });
			cy.openWebchat();
			cy.startConversation();
			cy.get(".webchat-privacy-notice-root").should("be.visible");
			cy.focused().should("have.class", "webchat-header-title");
		});

		it("moves focus to the screen title when the notice is the first screen after opening", () => {
			cy.initMockWebchat({ settings: { homeScreen: { enabled: false }, privacyNotice } });
			cy.get("#webchatWindowToggleButton").click();
			cy.get(".webchat-privacy-notice-root").should("be.visible");
			cy.focused().should("have.class", "webchat-header-title");
		});

		it("policy link is a native link announcing it opens in a new tab; accept is a native button", () => {
			cy.initMockWebchat({ settings: { privacyNotice } });
			cy.openWebchat();
			cy.startConversation();

			cy.get(".webchat-privacy-policy-link")
				.should("match", "a")
				.and("have.attr", "href", "https://example.com/policy")
				.and("have.attr", "target", "_blank")
				.and("have.attr", "rel", "noopener noreferrer")
				// Label in Name (SC 2.5.3): starts with the visible text
				.and("have.attr", "aria-label", "Our privacy policy. Opens in new tab");

			cy.get(".webchat-privacy-notice-accept-button")
				.should("match", "button")
				.and("have.text", "Submit");
		});

		itChromiumOnly(
			"accepting with the keyboard opens the chat screen and focuses the message input",
			() => {
				cy.initMockWebchat({ settings: { privacyNotice } });
				cy.openWebchat();
				cy.startConversation();
				cy.get(".webchat-privacy-notice-accept-button").focus();
				cy.realPress("Enter");

				cy.get(".webchat-privacy-notice-root").should("not.exist");
				cy.get(".webchat-input-message-input").should("be.focused");
			},
		);
	});
});
