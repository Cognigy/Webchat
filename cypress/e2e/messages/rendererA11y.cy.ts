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
	const GALLERY = ".webchat-carousel-template-root";
	const CALENDAR = ".flatpickr-calendar";

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

	it("gallery message has no detectable a11y violations (known upstream findings excluded)", () => {
		cy.withMessageFixture("gallery", () => {
			cy.get(".gallery-button-next").should("exist");
			// Two findings live inside the upstream carousel renderer
			// (@cognigy/chat-components Gallery) and are excluded here until they
			// are fixed there — tracked as CGY-37634 (see docs/accessibility.md,
			// "Known upstream findings"):
			//  - color-contrast: a card without an image renders its white title
			//    over the #cccccc placeholder (1.6:1, SC 1.4.3 needs 4.5:1)
			//  - target-size: swiper pagination bullets are 6×6px focusable
			//    buttons (SC 2.5.8 needs 24×24 CSS px)
			// Two scans keep the exclusion confined to the gallery: the rest of
			// the widget keeps the full rule set, the gallery drops only those two.
			cy.checkA11yCompliance(ROOT, { exclude: [GALLERY] });
			cy.checkA11yCompliance(GALLERY, { disabledRules: ["color-contrast", "target-size"] });
		});
	});

	it("image message has no detectable a11y violations", () => {
		cy.withMessageFixture("image", () => {
			cy.get(".webchat-media-template-image img").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	it("downloadable image thumbnail has no detectable a11y violations", () => {
		cy.withMessageFixture("downloadableImage-with-alt", () => {
			cy.get(".webchat-media-template-image[role=button]").should("be.visible");
			cy.checkA11yCompliance(ROOT);
		});
	});

	// The lightbox is an APG dialog rendered by chat-components; in the full
	// widget it must take focus on open and hand it back to the thumbnail on
	// Escape (SC 2.4.3). Uses the fixture WITH alt text: without it the lightbox
	// <img> renders no alt attribute at all (upstream finding, CGY-37634).
	it("open image lightbox has no detectable a11y violations and returns focus to the thumbnail on Escape", () => {
		cy.withMessageFixture("downloadableImage-with-alt", () => {
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

	it("open date picker dialog has no detectable a11y violations (known upstream findings excluded)", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".webchat-plugin-date-picker").should("be.visible");
			// flatpickr's calendar DOM (chat-components DatePicker) has two
			// ticketed findings tracked upstream as AB#144248 and allowlisted in
			// chat-components' own axe gate (0.80.0): grid/rowgroup without
			// role=row children, and gridcells outside role=row parents. (The
			// unnamed readonly <input class="flatpickr-input"> that gate also
			// lists is display:none in the widget, so axe does not flag it here.)
			// Two scans keep the exclusion confined to the calendar: the rest of
			// the widget — dialog header and footer buttons, message input —
			// keeps the full rule set, the calendar drops only the two grid rules.
			cy.checkA11yCompliance(ROOT, { exclude: [CALENDAR] });
			cy.checkA11yCompliance(CALENDAR, {
				disabledRules: ["aria-required-children", "aria-required-parent"],
			});
		});
	});
});
