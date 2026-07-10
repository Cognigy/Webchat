// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("Message with Quick Replies", () => {
	beforeEach(() => cy.visitWebchat().initMockWebchat().openWebchat().startConversation());

	it("should render message with quick replies", () => {
		cy.withMessageFixture("quick-replies", () => {
			cy.contains("foobar003");
			cy.contains("foobar003qr01");
			cy.contains("foobar003qr02");
		});
	});

	it("should verify quick reply behavior in enabled and disabled states", () => {
		// First run - check clickable state
		cy.withMessageFixture("quick-replies", () => {
			cy.get("button:contains('foobar003qr01')").last().should("not.be.disabled").focus();
			cy.get("button:contains('foobar003qr01')").last().click();
			cy.get(".webchat-message-row.user").contains("foobar003qr01");
		});

		// Second run - verify disabled state
		cy.withMessageFixture("quick-replies", () => {
			cy.get("button:contains('foobar003qr01')").last().should("be.disabled");
		});
	});

	// we have no button images on v3
	xit("should render image inside quick replies button", () => {
		cy.withMessageFixture("quick-replies", () => {
			cy.contains("foobar003qr02").children("img").should("have.length", 1);
		});
	});

	// we have no button images on v3
	xit("should render image alt text when present", () => {
		cy.withMessageFixture("quick-replies", () => {
			cy.contains("foobar003qr02")
				.children("img")
				.should("have.attr", "alt")
				.then(alttext => {
					expect(alttext).to.be.eq("alt text");
				});
		});
	});

	it("should use UL tag when more than one quick reply button", () => {
		cy.withMessageFixture("quick-replies", () => {
			cy.get(".webchat-quick-reply-template-replies-container").should(
				"have.prop",
				"tagName",
				"UL",
			);
		});
	});

	it("quick reply button list should have 'aria-labelledby' attribute", () => {
		cy.withMessageFixture("quick-replies", () => {
			cy.get(".webchat-quick-reply-template-replies-container")
				.invoke("attr", "aria-labelledby")
				.should("contain", "webchatButtonTemplateHeader");
		});
	});

	// As of @cognigy/chat-components 0.77.0 (AB#105550), action buttons have no aria-label;
	// the accessible name is formed from DOM content (sr-only position text + button title).
	it("quick reply button should have sr-only position text and no aria-label", () => {
		cy.withMessageFixture("quick-replies", () => {
			// "not.have.attr" must come last: it changes the yielded subject
			// to the attribute value (undefined), breaking chained assertions.
			cy.contains(".webchat-quick-reply-template-button", "foobar003qr01")
				.should("contain.text", "1 of 2: foobar003qr01")
				.should("not.have.attr", "aria-label");
			cy.contains(".webchat-quick-reply-template-button", "foobar003qr02")
				.should("contain.text", "2 of 2: foobar003qr02")
				.should("not.have.attr", "aria-label");
		});
	});
});
