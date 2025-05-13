// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("Message with Audio", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("should render audio player", () => {
		cy.withMessageFixture("audio", () => {
			cy.get(".webchat-message-row audio").should("exist");
			cy.get(".webchat-message-row audio").should("not.be.visible");
		});
	});

	it("should have controls in player", () => {
		cy.withMessageFixture("audio", () => {
			cy.get(
				".webchat-message-row [data-testid='audio-message'] [data-testid='audio-controls']",
			)
				.should("exist")
				.should("be.visible", { timeout: 4000 });
		});
	});

	it("should have class 'webchat-media-template-audio'", () => {
		cy.withMessageFixture("audio", () => {
			cy.get(".webchat-message-row .webchat-media-template-audio");
		});
	});
});
