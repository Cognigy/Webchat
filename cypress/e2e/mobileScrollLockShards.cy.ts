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

/**
 * Dispatch a vertical scroll gesture and report whether react-remove-scroll
 * cancelled it. Uses a wheel event rather than touch events because the `Touch`
 * / `TouchEvent` constructors are not available in all browsers (e.g. Firefox);
 * react-remove-scroll routes wheel and touch through the same allow/block logic.
 */
const scrollWasBlocked = (doc: Document, el: HTMLElement): boolean => {
	const win = doc.defaultView as Window & typeof globalThis;
	const rect = el.getBoundingClientRect();
	const wheel = new win.WheelEvent("wheel", {
		deltaY: 40, // scroll down; the element is pre-scrolled so it has room to move
		clientX: Math.round(rect.x + rect.width / 2),
		clientY: Math.round(rect.y + rect.height / 2),
		cancelable: true,
		bubbles: true,
		composed: true,
	});
	el.dispatchEvent(wheel);
	return wheel.defaultPrevented;
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
			expect(scrollWasBlocked(doc, shard), "OneTrust container scroll allowed").to.eq(false);
			expect(scrollWasBlocked(doc, nonShard), "unrelated overlay scroll blocked").to.eq(true);
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
			expect(scrollWasBlocked(doc, shard), "custom-selector container scroll allowed").to.eq(
				false,
			);
		});
	});
});
