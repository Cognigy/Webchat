// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

/**
 * Runtime axe sweeps of the message renderers *inside the chat window*.
 *
 * @cognigy/chat-components gates its renderers with axe under jsdom, which
 * cannot evaluate color contrast, target size or scroll metrics — those rules
 * are explicitly deferred to this real-browser run (see docs/accessibility.md,
 * "Boundary: Webchat vs. chat-components"). Each case receives a message
 * fixture into a live conversation and scans the widget root, so renderer
 * markup is checked against Webchat's real theme, layout and focus handling.
 *
 * Keyboard/ARIA behaviour of the renderers themselves is covered upstream
 * (chat-components test/*A11y.spec.tsx); this spec only adds what needs the
 * full widget: the real-browser rules and the in-context focus hand-offs.
 */

describe("Message renderers — Accessibility (WCAG 2.2 AA)", () => {
	const ROOT = "[data-cognigy-webchat-root]";
	const CALENDAR = ".flatpickr-calendar";
	const CALENDAR_GRID = ".flatpickr-rContainer";

	beforeEach(() => {
		cy.visitWebchat()
			.initMockWebchat({ settings: { homeScreen: { enabled: false } } })
			.openWebchat()
			.startConversation();
		cy.get(".webchat-input-message-input").should("be.visible");
	});

	it("text message has no detectable a11y violations", () => {
		cy.withMessageFixture("text", () => {
			cy.get(".webchat-message-row")
				.last()
				.should("be.visible")
				.and("contain.text", "foobar001");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("multiline text message has no detectable a11y violations", () => {
		cy.withMessageFixture("text-multiline", () => {
			cy.get(".webchat-message-row")
				.last()
				.should("be.visible")
				.and("contain.text", "foobar002");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("text with buttons has no detectable a11y violations", () => {
		cy.withMessageFixture("buttons", () => {
			cy.get(".webchat-chat-history [data-testid=action-buttons]").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	// array fixture: the callback (and the sweep) runs once per message variant
	it("quick replies have no detectable a11y violations", () => {
		cy.withMessageFixture("quick-replies", () => {
			// only the newest message's replies stay visible once the second variant lands
			cy.get(".webchat-quick-reply-template-replies-container").last().should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("list message has no detectable a11y violations", () => {
		cy.withMessageFixture("list", () => {
			cy.get(".webchat-list-template-root").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("gallery message has no detectable a11y violations", () => {
		cy.withMessageFixture("gallery", () => {
			cy.get(".gallery-button-next").should("exist");
			// Full rule set: the color-contrast (placeholder title) and target-size
			// (6x6 px pagination bullets) findings were fixed upstream in
			// @cognigy/chat-components 0.81.0 (CGY-37634).
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("image message has no detectable a11y violations", () => {
		cy.withMessageFixture("image", () => {
			cy.get(".webchat-media-template-image img").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("downloadable image thumbnail has no detectable a11y violations", () => {
		cy.withMessageFixture("downloadableImage", () => {
			cy.get(".webchat-media-template-image[role=button]").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	// The lightbox is an APG dialog rendered by chat-components; in the full
	// widget it must take focus on open and hand it back to the thumbnail on
	// Escape (SC 2.4.3). The fixture carries no alt text on purpose: since
	// chat-components 0.81.0 (CGY-37634) the lightbox <img> renders alt="" in
	// that case, so the image-alt rule must stay green here.
	it("open image lightbox has no detectable a11y violations and returns focus to the thumbnail on Escape", () => {
		cy.withMessageFixture("downloadableImage", () => {
			cy.get(".webchat-media-template-image[role=button]").click();
			cy.get('[role="dialog"]').should("be.visible");
			cy.focused().should("have.attr", "aria-label", "Download full-size image");
			cy.checkA11yCompliance(ROOT);

			// Hand the focus to Cypress before the key press (see datePicker.cy.ts):
			// in headless runs focus set by the app is not reliably the target of
			// the next synthetic/real key event.
			cy.get('[aria-label="Download full-size image"]').focus().type("{esc}");
			cy.get('[role="dialog"]').should("not.exist");
			cy.focused().should("have.attr", "aria-label", "View full-size image");
		});
	});

	it("audio message has no detectable a11y violations", () => {
		cy.withMessageFixture("audio", () => {
			cy.get(".webchat-message-row .webchat-media-template-audio").should("exist");
			// the custom controls mount once the media metadata has loaded
			cy.get("[data-testid='audio-controls']", { timeout: 10000 }).should("exist");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("video message has no detectable a11y violations", () => {
		cy.withMessageFixture("video", () => {
			cy.get(".webchat-message-row .react-player__preview").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("adaptive card has no detectable a11y violations", () => {
		cy.withMessageFixture("adaptivecard", () => {
			cy.contains("Your registration is almost complete").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("open date picker dialog has no detectable a11y violations (known upstream finding excluded)", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".webchat-plugin-date-picker").should("be.visible");
			// chat-components 0.81.0 (CGY-30560) exposes the calendar's row level
			// through visually hidden role="row" elements that own their cells via
			// aria-owns. axe-core does not model aria-owns precedence over DOM
			// parentage, so the grid (.flatpickr-rContainer) and the .flatpickr-days
			// rowgroup inside it still fail aria-required-children — the same two
			// nodes chat-components allowlists in its own axe gate.
			// aria-required-parent no longer fires (verified in a real browser on
			// 0.81.0). Three scans keep the exclusion node-granular: the widget
			// without the calendar, then the calendar chrome (month/year controls,
			// time fields) without the grid container — both on the full rule set —
			// and finally the grid container (weekday header + day cells) alone
			// with just that one rule off.
			cy.checkA11yCompliance(ROOT, { exclude: [CALENDAR] });
			cy.checkA11yCompliance(CALENDAR, { exclude: [CALENDAR_GRID] });
			cy.checkA11yCompliance(CALENDAR_GRID, { disabledRules: ["aria-required-children"] });
		});
	});
});
