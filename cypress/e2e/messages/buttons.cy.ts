// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("Message with Buttons", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("should render message header", () => {
		cy.withMessageFixture("buttons", () => {
			cy.contains("foobar005");
		});
	});

	it("should render message buttons", () => {
		cy.withMessageFixture("buttons", () => {
			cy.wrap([1, 2, 3, 4]).each(number => {
				cy.contains(`foobar005b${number}`);
			});
		});
	});

	it("should post in chat on postback button click", () => {
		cy.withMessageFixture("buttons", () => {
			cy.get("button:contains('foobar005b1')").should("be.visible").click({ force: true });
			cy.get(".webchat-message-row.user").contains("foobar005b1");
		});
	});

	it("should have static class names", () => {
		cy.withMessageFixture("buttons", () => {
			cy.get(".webchat-buttons-template-header")
				.get(".webchat-buttons-template-root")
				.get(".webchat-buttons-template-button");
		});
	});

	it("group off buttons should have tag UL", () => {
		cy.withMessageFixture("buttons", () => {
			cy.get(".webchat-chat-history [data-testid=action-buttons]")
				.should("have.prop", "tagName")
				.and("equal", "UL");
			cy.get(
				".webchat-chat-history [data-testid=action-buttons] .webchat-buttons-template-button",
			).should("have.length", 4);
		});
	});

	it("button group should have 'aria-labelledby' attribute", () => {
		cy.withMessageFixture("buttons", () => {
			cy.get(".webchat-chat-history [data-testid=action-buttons]")
				.invoke("attr", "aria-labelledby")
				.should("contain", "webchatButtonTemplateHeader");
		});
	});

	// As of @cognigy/chat-components 0.77.0 (AB#105550), action buttons have no aria-label;
	// the accessible name is formed from DOM content (sr-only position text + button title).
	it("buttons in group should have sr-only position text and no aria-label", () => {
		cy.withMessageFixture("buttons", () => {
			cy.wrap([1, 2, 3, 4]).each(number => {
				// "not.have.attr" must come last: it changes the yielded subject
				// to the attribute value (undefined), breaking chained assertions.
				cy.contains(".webchat-buttons-template-button", `foobar005b${number}`)
					.should("contain.text", `${number} of 4: foobar005b${number}`)
					.should("not.have.attr", "aria-label");
			});
		});
	});

	it("phone number button should be an anchor element with 'href' attribute", () => {
		cy.withMessageFixture("buttons", () => {
			cy.contains("a", "foobar005b4")
				.invoke("attr", "href")
				.should("contain", `tel:000111222`);
		});
	});
});
