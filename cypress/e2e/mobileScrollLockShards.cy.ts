// Verifies the mobile scroll-lock `shards` behavior (AZ 138678, Solution 2).
// While the webchat holds the mobile scroll lock, scroll gestures are cancelled
// everywhere on the host page EXCEPT inside whitelisted overlays (consent-manager
// containers by default, plus `widgetSettings.scrollLockAllowSelectors`), which
// must keep their own internal scrolling. We assert this by dispatching a real
// touch-drag and checking whether react-remove-scroll cancels it (defaultPrevented).

const MOBILE: [number, number] = [375, 700];

const injectScroller = (doc: Document, id: string) => {
	const el = doc.createElement("div");
	el.id = id;
	el.style.cssText =
		"position:fixed;top:10px;left:10px;width:200px;height:200px;overflow-y:scroll;z-index:2147483647";
	const inner = doc.createElement("div");
	inner.style.height = "1000px";
	el.appendChild(inner);
	doc.body.appendChild(el);
	el.scrollTop = 50; // mid-scroll so it can scroll in either direction
	return el;
};

/** Dispatch a vertical touch-drag and report whether the scroll gesture was cancelled. */
const dragWasBlocked = (doc: Document, el: HTMLElement): boolean => {
	const win = doc.defaultView as Window & typeof globalThis;
	const rect = el.getBoundingClientRect();
	const cx = Math.round(rect.x + rect.width / 2);
	const cy = Math.round(rect.y + rect.height / 2);
	const touch = (y: number) =>
		new win.Touch({ identifier: 1, target: el, clientX: cx, clientY: y, pageX: cx, pageY: y });
	const ev = (type: string, y: number, withTouches: boolean) =>
		new win.TouchEvent(type, {
			cancelable: true,
			bubbles: true,
			composed: true,
			touches: withTouches ? [touch(y)] : [],
			targetTouches: withTouches ? [touch(y)] : [],
			changedTouches: [touch(y)],
		});

	el.dispatchEvent(ev("touchstart", cy, true));
	const move = ev("touchmove", cy - 40, true); // finger up -> content scrolls down
	el.dispatchEvent(move);
	el.dispatchEvent(ev("touchend", cy - 40, false));
	return move.defaultPrevented;
};

describe("Mobile scroll-lock shards (consent banners)", () => {
	it("allows scrolling inside a built-in consent-manager container while blocking the rest", () => {
		cy.viewport(...MOBILE);
		cy.visitWebchat().initMockWebchat();
		cy.document().then(doc => {
			injectScroller(doc, "onetrust-consent-sdk"); // built-in default shard
			injectScroller(doc, "some-unrelated-overlay"); // not whitelisted
		});
		cy.openWebchat();

		cy.get("[data-cognigy-webchat]").should("exist");
		cy.get("body").should("have.attr", "data-scroll-locked"); // lock is active
		cy.wait(150); // let the MutationObserver-driven shard resolution settle

		cy.document().then(doc => {
			const shard = doc.getElementById("onetrust-consent-sdk") as HTMLElement;
			const nonShard = doc.getElementById("some-unrelated-overlay") as HTMLElement;
			expect(dragWasBlocked(doc, shard), "OneTrust container scroll allowed").to.eq(false);
			expect(dragWasBlocked(doc, nonShard), "unrelated overlay scroll blocked").to.eq(true);
		});
	});

	it("honors a custom selector passed via scrollLockAllowSelectors", () => {
		cy.viewport(...MOBILE);
		cy.visitWebchat().initMockWebchat({
			settings: { widgetSettings: { scrollLockAllowSelectors: ["#my-cookie-bar"] } },
		});
		cy.document().then(doc => {
			injectScroller(doc, "my-cookie-bar");
		});
		cy.openWebchat();

		cy.get("body").should("have.attr", "data-scroll-locked");
		cy.wait(150);

		cy.document().then(doc => {
			const shard = doc.getElementById("my-cookie-bar") as HTMLElement;
			expect(dragWasBlocked(doc, shard), "custom-selector container scroll allowed").to.eq(
				false,
			);
		});
	});
});
