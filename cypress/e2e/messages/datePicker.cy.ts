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
			// Diagnostic tracer (CGY-30265 CI investigation): record every
			// programmatic focus() call in the app window with its caller, so the
			// runner log shows what moves focus after the dialog opens.
			cy.window().then(win => {
				const traced = win as Window & { __focusLog?: string[] };
				traced.__focusLog = [];
				const proto = win.HTMLElement.prototype as unknown as {
					focus: (this: HTMLElement, ...args: unknown[]) => void;
				};
				const original = proto.focus;
				proto.focus = function (this: HTMLElement, ...args: unknown[]) {
					const stack = (new Error().stack || "")
						.split("\n")
						.slice(2, 8)
						.map(line => line.trim())
						.join(" <- ");
					traced.__focusLog?.push(
						`${Date.now() % 100000} ${this.tagName.toLowerCase()}#${this.id}.${String(this.className).slice(0, 40)} :: ${stack}`,
					);
					return original.apply(this, args);
				};
			});

			// Diagnostic: tag stable nodes so we can tell which subtree remounts
			// around the click (the trace showed the message input remounting).
			const DIAG_SELECTORS = [
				"[data-cognigy-webchat-root]",
				"#webchatWindow",
				".webchat-header-bar",
				"#webchatChatHistory",
				".webchat-input",
				".webchat-input-message-input",
				"[data-testid=button-open]",
			];
			const snapshotUi = (label: string) =>
				cy.window().then(win => {
					const w = win as Window & {
						webchat?: { store: { getState: () => Record<string, unknown> } };
					};
					const state = w.webchat?.store.getState() ?? {};
					const ui = (state.ui ?? {}) as Record<string, unknown>;
					const connection = (state.connection ?? {}) as Record<string, unknown>;
					const picked = Object.keys(ui)
						.filter(k => typeof ui[k] !== "object" || ui[k] === null)
						.map(k => `${k}=${String(ui[k])}`)
						.join(" ");
					cy.task(
						"log",
						`[ui ${label}] ${picked} | connection: ${Object.keys(connection)
							.map(k => `${k}=${String(connection[k])}`)
							.join(" ")} | inner=${win.innerWidth}x${win.innerHeight}`,
					);
				});
			cy.document().then(doc => {
				DIAG_SELECTORS.forEach(sel =>
					doc.querySelector(sel)?.setAttribute("data-diag", "1"),
				);
			});
			snapshotUi("before click");
			// Diagnostic: record store slice changes, window (re)mounts and window
			// events with timestamps, to see what remounts #webchatWindow on click.
			cy.window().then(win => {
				type Store = {
					getState: () => Record<string, Record<string, unknown>>;
					subscribe: (listener: () => void) => () => void;
				};
				const w = win as Window & { webchat?: { store: Store }; __diag?: string[] };
				const log: string[] = [];
				w.__diag = log;
				const t0 = Date.now();
				const stamp = () => `+${Date.now() - t0}ms`;
				const store = w.webchat?.store;
				if (store) {
					let prev = store.getState();
					store.subscribe(() => {
						const next = store.getState();
						const changed: string[] = [];
						[
							"ui",
							"config",
							"connection",
							"input",
							"messages",
							"typing",
							"userTyping",
						].forEach(slice => {
							const a = (prev[slice] ?? {}) as Record<string, unknown>;
							const b = (next[slice] ?? {}) as Record<string, unknown>;
							Object.keys({ ...a, ...b }).forEach(key => {
								if (a[key] !== b[key]) changed.push(`${slice}.${key}`);
							});
						});
						if (changed.length) log.push(`${stamp()} store: ${changed.join(",")}`);
						prev = next;
					});
				}
				const root = win.document.querySelector("[data-cognigy-webchat-root]");
				if (root) {
					new win.MutationObserver(records => {
						records.forEach(r => {
							r.removedNodes.forEach(n => {
								if ((n as Element).id === "webchatWindow")
									log.push(`${stamp()} #webchatWindow REMOVED`);
							});
							r.addedNodes.forEach(n => {
								if ((n as Element).id === "webchatWindow")
									log.push(`${stamp()} #webchatWindow ADDED`);
							});
						});
					}).observe(root, { childList: true, subtree: true });
				}
				["resize", "focus", "blur", "visibilitychange", "pageshow"].forEach(type =>
					(type === "visibilitychange" ? win.document : win).addEventListener(type, () =>
						log.push(`${stamp()} event: ${type}`),
					),
				);
			});

			cy.contains("foobar012b1").click();
			cy.get(heading).should("be.focused");
			logActiveElement("date picker: t+0");
			cy.document().then(doc => {
				const survived = DIAG_SELECTORS.map(
					sel =>
						`${sel}:${doc.querySelector(sel)?.getAttribute("data-diag") === "1" ? "same" : "REMOUNTED/missing"}`,
				);
				cy.task("log", `[remount] ${survived.join(" | ")}`);
			});
			snapshotUi("after click");
			cy.wait(300);
			cy.window().then(win => {
				const w = win as Window & { __diag?: string[] };
				cy.task("log", "[diag]\n" + (w.__diag ?? []).join("\n"));
			});
			cy.wait(150);
			logActiveElement("date picker: t+150");
			cy.wait(150);
			logActiveElement("date picker: t+300");
			cy.wait(200);
			logActiveElement("date picker: t+500");
			cy.window().then(win => {
				const traced = win as Window & { __focusLog?: string[] };
				cy.task("log", "[focus-calls]\n" + (traced.__focusLog ?? []).join("\n"));
			});
			cy.document().then(doc => cy.task("log", `[document.hasFocus] ${doc.hasFocus()}`));
			// the app's focus move must stick — nothing may pull focus back later
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
