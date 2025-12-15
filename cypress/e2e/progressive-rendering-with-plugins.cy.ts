// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

describe("Progressive Rendering with Plugin Messages", () => {
	beforeEach(() => {
		cy.visitWebchat();

		cy.initMockWebchat({
			settings: {
				behavior: {
					progressiveMessageRendering: true,
				},
			},
		});

		cy.openWebchat();
		cy.startConversation();
	});

	it("should render all messages including plugin messages when progressive rendering is enabled", () => {
		// Send first bot message
		cy.receiveMessage("First message");
		cy.contains("First message").should("be.visible");

		// Send second bot message
		cy.receiveMessage("Second message");
		cy.contains("Second message").should("be.visible");

		// Send plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify plugin is rendered
			cy.contains("Google").should("be.visible");
		});

		// Send message after plugin
		cy.receiveMessage("Message after plugin");

		// Verify all messages are visible
		cy.contains("First message").should("be.visible");
		cy.contains("Second message").should("be.visible");
		cy.contains("Message after plugin").should("be.visible");

		// Verify all messages are in the chat history
		cy.get("#webchatChatHistory").within(() => {
			cy.contains("First message").should("exist");
			cy.contains("Second message").should("exist");
			cy.contains("Google").should("exist");
			cy.contains("Message after plugin").should("exist");
		});
	});

	it("should render messages before plugin message when progressive rendering is enabled", () => {
		// Send multiple messages before plugin
		cy.receiveMessage("Message 1");
		cy.receiveMessage("Message 2");
		cy.receiveMessage("Message 3");

		// Verify all messages are visible
		cy.contains("Message 1").should("be.visible");
		cy.contains("Message 2").should("be.visible");
		cy.contains("Message 3").should("be.visible");

		// Send plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify plugin is rendered
			cy.contains("Google").should("be.visible");
		});

		// Verify all previous messages are still visible
		cy.contains("Message 1").should("be.visible");
		cy.contains("Message 2").should("be.visible");
		cy.contains("Message 3").should("be.visible");
	});

	it("should render messages after plugin message when progressive rendering is enabled", () => {
		// Send message before plugin
		cy.receiveMessage("Before plugin");
		cy.contains("Before plugin").should("be.visible");

		// Send plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify plugin is rendered
			cy.contains("Google").should("be.visible");
		});

		// Send multiple messages after plugin
		cy.receiveMessage("After plugin 1");
		cy.receiveMessage("After plugin 2");
		cy.receiveMessage("After plugin 3");

		// Verify all messages are visible
		cy.contains("Before plugin").should("be.visible");
		cy.contains("After plugin 1").should("be.visible");
		cy.contains("After plugin 2").should("be.visible");
		cy.contains("After plugin 3").should("be.visible");
	});

	it.skip("should render multiple plugin messages correctly with progressive rendering", () => {
		// Send first message
		cy.receiveMessage("First message");
		cy.contains("First message").should("be.visible");

		// Send first plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify first plugin is rendered
			cy.get("#webchatChatHistory").within(() => {
				cy.contains("Google").should("exist");
			});
		});

		// Send message between plugins
		cy.receiveMessage("Between plugins");
		cy.contains("Between plugins").should("be.visible");

		// Send second plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify second plugin is rendered
			cy.contains("Google").should("exist");
		});

		// Send last message
		cy.receiveMessage("Last message");

		// Verify all messages are visible
		cy.contains("First message").should("be.visible");
		cy.contains("Between plugins").should("be.visible");
		cy.contains("Last message").should("be.visible");

		// Count total messages in history (should have 2 plugin messages + 3 text messages)
		cy.get("#webchatChatHistory").within(() => {
			cy.contains("First message").should("exist");
			cy.contains("Between plugins").should("exist");
			cy.contains("Last message").should("exist");
			// Verify both plugin instances are rendered
			cy.get('a[href*="google.com/maps"]').should("have.length", 2);
		});
	});

	it("should not block message animation for subsequent messages after plugin", () => {
		// Send message before plugin
		cy.receiveMessage("Before plugin");
		cy.contains("Before plugin").should("be.visible");

		// Send plugin message
		cy.withMessageFixture("plugin-message", () => {
			// Verify plugin is rendered
			cy.contains("Google").should("be.visible");
		});

		// Send message after plugin
		cy.receiveMessage("After plugin");

		// Verify the message after plugin is visible and rendered
		cy.contains("After plugin").should("be.visible");

		// Verify the message has proper structure
		cy.get("#webchatChatHistory").within(() => {
			cy.contains("After plugin").should("exist");
		});
	});

	it("should immediately show plugin messages without waiting for animation queue", () => {
		// Send a message that will be animating
		cy.receiveMessage("Animating message");

		// Immediately send plugin message while first message is still animating
		cy.withMessageFixture("plugin-message", () => {
			// Plugin should be visible immediately, not waiting for animation queue
			cy.contains("Google").should("be.visible");
		});

		// First message should also be visible
		cy.contains("Animating message").should("be.visible");

		// Send another regular message
		cy.receiveMessage("After plugin");

		// All messages should be visible
		cy.get("#webchatChatHistory").within(() => {
			cy.contains("Animating message").should("exist");
			cy.contains("Google").should("exist");
			cy.contains("After plugin").should("exist");
		});
	});
});
