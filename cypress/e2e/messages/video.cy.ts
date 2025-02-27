// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../support/index.d.ts" />

describe("Message with Video", () => {
	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	it("should render video player", () => {
		cy.withMessageFixture("video", () => {
			cy.get(".webchat-message-row .react-player__preview").should("be.visible");
			cy.get(".webchat-message-row video").should("not.exist");

			cy.get(".webchat-message-row .react-player__preview").click();
			cy.get(".webchat-message-row video").should("be.visible");
		});
	});

	it("should have controls in player", () => {
		cy.withMessageFixture("video", () => {
			cy.get(".webchat-message-row .react-player__preview").click();
			cy.get(".webchat-message-row video").should("have.attr", "controls");
		});
	});

	it("should have class 'webchat-media-template-video'", () => {
		cy.withMessageFixture("video", () => {
			cy.get(".webchat-message-row .webchat-media-template-video");
		});
	});
});
