describe("File Attachement", () => {
	beforeEach(() => {
		cy.visitWebchat();
	});

	it("button should not be visible by default", () => {
		cy.initMockWebchat().openWebchat().startConversation();
		cy.get("#webchatInputMessageAttachFileButton").should("not.exist");
	});

	it("button should be visible when the setting is enabled", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.openWebchat().startConversation();
		cy.get("#webchatInputMessageAttachFileButton").should("be.visible");
	});

	it("button should not be visible when the setting is disabled", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: false,
				},
			},
		});
		cy.openWebchat().startConversation();
		cy.get("#webchatInputMessageAttachFileButton").should("not.exist");
	});

	it("upload should fail if file storage provider not configured", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
		cy.openWebchat().startConversation();
		cy.get("input[type=file]").selectFile(
			{
				contents: Cypress.Buffer.from("file contents"),
				fileName: "myfile.txt",
				mimeType: "text/plain",
				lastModified: Date.now(),
			},
			{ force: true },
		);
		cy.get("#filePreview0").contains("Upload Failed");
	});

	it("upload failure should disable the send button", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
		cy.openWebchat().startConversation();
		cy.get("input[type=file]").selectFile(
			{
				contents: Cypress.Buffer.from("file contents"),
				fileName: "myfile.txt",
				mimeType: "text/plain",
				lastModified: Date.now(),
			},
			{ force: true },
		);
		cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");
	});

	/**
	 * The Send button is disabled while `fileUploadError` is set, but Enter reaches
	 * `BaseInput.handleSubmit` directly from `handleInputKeyDown` without consulting
	 * the button. Before the guard repeated the button's condition, Enter submitted
	 * the typed text while the attachments loop skipped the errored file — so the
	 * message went out without the attachment the user believed they were sending.
	 */
	it("upload failure should block sending on Enter, not just the send button", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
		cy.openWebchat().startConversation();
		cy.get("input[type=file]").selectFile(
			{
				contents: Cypress.Buffer.from("file contents"),
				fileName: "myfile.txt",
				mimeType: "text/plain",
				lastModified: Date.now(),
			},
			{ force: true },
		);
		cy.get("#filePreview0").contains("Upload Failed");
		cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");

		cy.get("textarea.webchat-input-message-input").type("hi{enter}");

		// A blocked submit leaves the text in place — `handleSubmit` only clears it on
		// a successful send, so this discriminates without waiting out a negative.
		cy.get("textarea.webchat-input-message-input").should("have.value", "hi");
		cy.getHistory().then(history => {
			expect(history.length).to.equal(0);
		});

		// Removing the failed attachment clears `fileUploadError`, so Enter works
		// again: the block is specific to the error, it does not disable Enter.
		cy.get("[aria-label='Remove file attachment 1']").click();
		cy.get("#filePreview0").should("not.exist");
		cy.get("textarea.webchat-input-message-input").type("{enter}");
		cy.getMessageFromHistory({ text: "hi", source: "user" });
	});

	it("should be able to upload multiple files", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
		cy.openWebchat().startConversation();
		cy.get("input[type=file]").selectFile(
			[
				{
					contents: Cypress.Buffer.from("file contents"),
					fileName: "myfile.txt",
					mimeType: "text/plain",
					lastModified: Date.now(),
				},
				{
					contents: Cypress.Buffer.from("file contents"),
					fileName: "myfile2.txt",
					mimeType: "text/plain",
					lastModified: Date.now(),
				},
			],
			{ force: true },
		);
		cy.get("#filePreview0").contains("Upload Failed");
		cy.get("#filePreview1").contains("Upload Failed");
	});

	it("should be removable from the list by clicking remove button", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.openWebchat().startConversation();
		cy.get("input[type=file]")
			.selectFile(
				{
					contents: Cypress.Buffer.from("file contents"),
					fileName: "myfile.txt",
					mimeType: "text/plain",
					lastModified: Date.now(),
				},
				{ force: true },
			)
			.then(() => {
				cy.get("#filePreview0").contains("myfile.txt");
				cy.get("[aria-label='Remove file attachment 1']").click();
				cy.get("#filePreview0").should("not.exist");
			});
	});

	it("should be possible by drag and drop action", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
		cy.openWebchat().startConversation();
		cy.get("input[type=file]").selectFile(
			{
				contents: Cypress.Buffer.from("file contents"),
				fileName: "myfile.txt",
				mimeType: "text/plain",
				lastModified: Date.now(),
			},
			{ action: "drag-drop", force: true },
		);
		cy.get("#filePreview0").contains("Upload Failed");
	});

	it("drop zone should have the default drop text", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
				},
			},
		});
		cy.openWebchat().startConversation();
		cy.get("#webchatChatHistory").trigger("dragenter");
		cy.get("#dropzoneContent").contains("Drop to attach");
	});

	it("drop zone should have the default drop text", () => {
		cy.initMockWebchat({
			settings: {
				fileStorageSettings: {
					enabled: true,
					dropzoneText: "Please drop here",
				},
			},
		});
		cy.openWebchat().startConversation();
		cy.get("#webchatChatHistory").trigger("dragenter");
		cy.get("#dropzoneContent").contains("Please drop here");
	});

	// TODO: Add test for successful file upload
});
