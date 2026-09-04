// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

import * as moment from "moment";

// cypress-real-events dispatches real key events over CDP — Chromium only. The
// Firefox run keeps every assertion that does not need a native Tab key.
const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;

// Writes document.activeElement to the runner log (cy.task("log")) so CI output
// shows where focus actually is around real key presses.
const logActiveElement = (label: string) =>
	cy.document().then(doc => {
		const el = doc.activeElement;
		const description = el
			? `${el.tagName.toLowerCase()}#${el.id} .${String(el.className).slice(0, 60)} [${el.getAttribute("aria-label") ?? el.getAttribute("data-testid") ?? ""}]`
			: "null";
		cy.task("log", `[focus] ${label}: ${description}`);
	});

describe("Date Picker", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("should render plugin open button", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").should("be.visible");
		});
	});

	it("should open 'fullheight' plugin on open button click", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1")
				.click()
				.get(".webchat-plugin-date-picker-header")
				.contains(/^foobar012$/);
		});
	});

	it("should render cancel and submit buttons", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			// cy.contains("foobar012b2");
			cy.contains("foobar012b3");
		});
	});

	it("should select today and post the date in chat", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".flatpickr-day.today").click();
			cy.contains("foobar012b3").click();

			// Our default locale for english is "en-US"
			const formattedDate = moment().format("MM/DD/YYYY");
			cy.get(".webchat-message-row.user").contains(formattedDate);
		});
	});

	it("plugin should have aria attributes necessary for a dialog", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".webchat-plugin-date-picker")
				.should("have.attr", "role", "dialog")
				.should("have.attr", "aria-modal", "true")
				.should("have.attr", "aria-labelledby");
		});
	});

	it("calender container element should have tabIndex -1", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".flatpickr-calendar ").should("have.attr", "tabIndex", "-1");
		});
	});

	it("dialog heading should be auto-focused on open", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			// As of @cognigy/chat-components 0.76.0 the calendar grid a11y rework (AB#118957)
			// moves focus to the dialog heading (tabIndex=-1) on open, so the screen reader
			// announces the dialog name; the grid then uses roving tabindex (ARIA APG).
			cy.get(".webchat-plugin-date-picker-header .webchat-list-template-header-title").should(
				"be.focused",
			);
		});
	});

	// APG modal dialog: Tab focus stays inside while open. The wrap is driven by
	// real key events (cypress-real-events, CDP), so it runs in Chromium only.
	// Heading -> Shift+Tab wraps to the last control (the submit button, enabled
	// because the fixture's minDate preselects today); Tab from there wraps to
	// the first control (the close button).
	itChromiumOnly("traps Tab focus inside the dialog (APG dialog pattern)", () => {
		const heading = ".webchat-plugin-date-picker-header .webchat-list-template-header-title";
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(heading).should("be.focused");
			// the app's focus move must stick — nothing may pull focus back later
			cy.wait(500);
			cy.get(heading).should("be.focused");

			// Hand the focus to Cypress before the real key press: in headless runs
			// the CDP key event is not reliably routed to an element the app focused
			// programmatically (the runner's focus polyfill), while an element
			// focused through cy.focus() always receives it.
			cy.get(heading).focus();
			logActiveElement("date picker: before Shift+Tab");
			cy.realPress(["Shift", "Tab"]);
			logActiveElement("date picker: after Shift+Tab");
			cy.focused().should("have.attr", "data-testid", "button-submit");

			cy.realPress("Tab");
			cy.focused().should("have.attr", "data-testid", "button-close");
		});
	});

	it("closes on Escape and returns focus to the button that opened it (SC 2.4.3)", () => {
		cy.withMessageFixture("date-picker", () => {
			cy.contains("foobar012b1").click();
			cy.get(".webchat-plugin-date-picker-header .webchat-list-template-header-title").should(
				"be.focused",
			);

			cy.focused().type("{esc}");
			cy.get(".webchat-plugin-date-picker").should("not.exist");
			cy.focused().should("have.attr", "data-testid", "button-open");
		});
	});

	it("should have class disabled for %2 weekdays", () => {
		/* When the weekday %2 is true, the date is disabled > "have.class" "flatpickr-disabled" */

		cy.withMessageFixture("date-picker-function", () => {
			cy.contains("foobar012b1").click();
			cy.contains(".flatpickr-day", "9").should("have.class", "flatpickr-disabled");
			cy.contains(".flatpickr-day", "8").should("not.have.class", "flatpickr-disabled");
			cy.contains(".flatpickr-day", "10").should("not.have.class", "flatpickr-disabled");
			cy.contains(".flatpickr-day", "7").should("have.class", "flatpickr-disabled");
			cy.contains(".flatpickr-day", "11").should("have.class", "flatpickr-disabled");
		});
	});

	it("should render the date picker even if the provided function throws a TypeError", () => {
		cy.withMessageFixture("date-picker-function-invalid", () => {
			cy.contains("foobar012b1").click();
		});
	});
});
