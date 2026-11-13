/**
 * Coverage for the programmatic open APIs.
 *
 * - `webchat.open()` toggles: calling it on an open Webchat closes it. This is
 *   documented behaviour that existing integrations rely on, so it must not change.
 * - `webchat.show()` only ever opens: it is safe to call from several "Start chat"
 *   buttons on a page, however many times they are clicked.
 * - `webchat.toggle()` and `webchat.close()` are unchanged.
 */

const isOpen = (webchat: any): boolean => webchat.store.getState().ui.open;

describe("Programmatic open APIs", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat();
	});

	it("webchat.open() keeps its documented toggle behaviour", () => {
		cy.getWebchat().then(async (webchat: any) => {
			expect(isOpen(webchat), "initially closed").to.equal(false);

			await webchat.open();
			expect(isOpen(webchat), "open() on a closed Webchat opens it").to.equal(true);

			await webchat.open();
			expect(isOpen(webchat), "open() on an open Webchat closes it").to.equal(false);
		});
	});

	it("webchat.show() opens a closed Webchat", () => {
		cy.getWebchat().then(async (webchat: any) => {
			await webchat.show();
			expect(isOpen(webchat)).to.equal(true);
		});
	});

	it("webchat.show() leaves an open Webchat open when called repeatedly", () => {
		cy.getWebchat().then(async (webchat: any) => {
			await webchat.show();
			await webchat.show();
			await webchat.show();
			expect(isOpen(webchat), "still open after 3 calls").to.equal(true);
		});
	});

	it("webchat.show() does not close a Webchat opened by webchat.open()", () => {
		cy.getWebchat().then(async (webchat: any) => {
			await webchat.open();
			await webchat.show();
			expect(isOpen(webchat)).to.equal(true);
		});
	});

	it("webchat.show() reopens the Webchat after webchat.close()", () => {
		cy.getWebchat().then(async (webchat: any) => {
			await webchat.show();
			webchat.close();
			expect(isOpen(webchat), "closed").to.equal(false);

			await webchat.show();
			expect(isOpen(webchat), "reopened").to.equal(true);
		});
	});

	it("webchat.toggle() still toggles", () => {
		cy.getWebchat().then((webchat: any) => {
			webchat.toggle();
			expect(isOpen(webchat), "toggle() opens").to.equal(true);

			webchat.toggle();
			expect(isOpen(webchat), "toggle() closes").to.equal(false);
		});
	});

	it("shows the chat window when webchat.show() is called twice", () => {
		cy.getWebchat().then(async (webchat: any) => {
			await webchat.show();
			await webchat.show();
		});

		cy.get('[aria-label="Close chat"]').should("be.visible");
	});
});
