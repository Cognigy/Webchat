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

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		// cypress-real-events dispatches real key events over CDP — Chromium only.
		const itChromiumOnly = Cypress.isBrowser({ family: "chromium" }) ? it : it.skip;

		const initWithFileStorage = (settings: Record<string, unknown> = {}) =>
			cy.initMockWebchat({
				settings: {
					homeScreen: { enabled: false },
					fileStorageSettings: { enabled: true },
					...settings,
				},
			});

		const selectFiles = (fileNames: string[]) =>
			cy.get("input[type=file]").selectFile(
				fileNames.map(fileName => ({
					contents: Cypress.Buffer.from("file contents"),
					fileName,
					mimeType: "text/plain",
					lastModified: Date.now(),
				})),
				{ force: true },
			);

		// Mocks a successful upload end to end: the token request, then the
		// multipart POST to the (same-origin) upload URL it hands out.
		const mockSuccessfulUpload = () => {
			cy.intercept("GET", "**/fileuploadtoken", {
				body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
			});
			cy.intercept("POST", "**/mock-upload", {
				body: {
					runtimeFileId: "mock-file-id",
					status: "scanned",
					mimeType: "text/plain",
					size: 13,
					url: "https://example.com/mock-upload/myfile.txt",
				},
			}).as("fileUpload");
		};

		// The file-input middleware re-dispatches its own snapshot of the list at
		// +100ms and again when every upload has settled, so a removal issued while
		// an upload is still in flight is overwritten (see docs/accessibility.md,
		// follow-ups). Wait until each chip has dropped its progress bar (100%).
		const waitForUploadsToSettle = (count: number) => {
			for (let i = 0; i < count; i++) {
				cy.wait("@fileUpload");
				cy.get(`#filePreview${i} > div`).should("have.length", 1);
			}
		};

		it("attach button is a named native button and the hidden file input is not exposed to assistive tech", () => {
			initWithFileStorage();
			cy.openWebchat().startConversation();

			cy.get("#webchatInputMessageAttachFileButton")
				.should("match", "button")
				.and("have.attr", "aria-label", "Add attachments");
			// the real <input type=file> is display:none and driven by the button
			cy.get("input[type=file]").should("have.attr", "aria-hidden", "true");
			cy.get("input[type=file]").should("not.be.visible");
		});

		it("honors the configurable addAttachment / removeFileAttachment aria labels", () => {
			initWithFileStorage({
				customTranslations: {
					ariaLabels: {
						addAttachment: "Datei anhängen",
						removeFileAttachment: "Anhang entfernen",
					},
				},
			});
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			cy.get("#webchatInputMessageAttachFileButton").should(
				"have.attr",
				"aria-label",
				"Datei anhängen",
			);
			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0 button").should("have.attr", "aria-label", "Anhang entfernen 1");
		});

		it("queued attachments have no detectable a11y violations and each remove button is named by position", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt", "second.txt"]);
			cy.get("#filePreview0").should("contain.text", "myfile.txt");
			cy.get("#filePreview1").should("contain.text", "second.txt");

			cy.get("#filePreview0 button")
				.should("match", "button")
				.and("have.attr", "aria-label", "Remove file attachment 1");
			cy.get("#filePreview1 button")
				.should("match", "button")
				.and("have.attr", "aria-label", "Remove file attachment 2");
			// a queued upload makes the message sendable without text
			cy.get("#webchatInputMessageSendMessageButton").should("not.be.disabled");

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		// SC 1.4.1 Use of Color: the failure state is conveyed by text in the
		// attachment chip ("Upload Failed"), not only by its red colour.
		it("failed upload is conveyed as text in the attachment chip and has no detectable a11y violations", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "Upload Failed");
			cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		itChromiumOnly(
			"remove button is keyboard-operable (Enter removes exactly that attachment)",
			() => {
				initWithFileStorage();
				mockSuccessfulUpload();
				cy.openWebchat().startConversation();

				selectFiles(["myfile.txt", "second.txt"]);
				cy.get("#filePreview1").should("contain.text", "second.txt");
				waitForUploadsToSettle(2);

				cy.get("[aria-label='Remove file attachment 2']").focus();
				cy.realPress("Enter");
				cy.get("#filePreview1").should("not.exist");
				cy.get("#filePreview0").should("contain.text", "myfile.txt");
			},
		);
	});
});
