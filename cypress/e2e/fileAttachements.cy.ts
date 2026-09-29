import { itChromiumOnly } from "../support/browser";

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

	// TODO: Add test for a successful file upload being sent with the message
	// (the a11y block below mocks the upload, but stops short of sending).

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
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

		// SC 4.1.3 Status Messages: the outcome of an upload is announced through
		// the always-mounted status live region (#webchatStatusLiveRegion,
		// role="status" — see docs/accessibility.md for why not role="alert"),
		// never by a live region around the chips themselves.
		it("announces a finished upload through the status live region", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#webchatStatusLiveRegion")
				.should("have.attr", "role", "status")
				.and("contain.text", "myfile.txt attached");

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("announces several uploads that finish together as one count", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt", "second.txt"]);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "2 files attached");
		});

		it("announces a failed upload with the file name and the reason shown in the chip", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "Upload Failed");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt: Upload Failed");
		});

		it("announces a rejected oversized file at once and a mixed batch as one message, failures first", () => {
			initWithFileStorage({ fileAttachmentMaxSize: 1024 * 1024 });
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			// Rejected client-side before any request: announced without waiting.
			cy.get("input[type=file]").selectFile(
				{
					contents: Cypress.Buffer.alloc(2 * 1024 * 1024),
					fileName: "big.bin",
					mimeType: "application/octet-stream",
					lastModified: Date.now(),
				},
				{ force: true },
			);
			cy.get("#filePreview0").should("contain.text", "File size > 1MB");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "big.bin: File size > 1MB");
			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");

			// Oversized file next to a real upload: one message once both settled.
			cy.get("input[type=file]").selectFile(
				[
					{
						contents: Cypress.Buffer.alloc(2 * 1024 * 1024),
						fileName: "big2.bin",
						mimeType: "application/octet-stream",
						lastModified: Date.now(),
					},
					{
						contents: Cypress.Buffer.from("file contents"),
						fileName: "myfile.txt",
						mimeType: "text/plain",
						lastModified: Date.now(),
					},
				],
				{ force: true },
			);
			cy.get("#webchatStatusLiveRegion").should(
				"contain.text",
				"big2.bin: File size > 1MB. myfile.txt attached",
			);
		});

		it("announces each outcome once although the middleware re-dispatches its file list snapshot", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#webchatStatusLiveRegion > div")
				.should("have.length", 1)
				.and("contain.text", "myfile.txt attached")
				.then($announced => {
					// The middleware's +100ms snapshot (same items, same outcome)
					// must not remount the announcement node, which would re-announce it.
					cy.wait(400);
					cy.get("#webchatStatusLiveRegion > div").should($after => {
						expect($after).to.have.length(1);
						expect($after[0]).to.equal($announced[0]);
					});
				});
		});

		it("honors the configurable upload failure text and announcement templates", () => {
			initWithFileStorage({
				customTranslations: {
					file_upload_failed: "Hochladen fehlgeschlagen",
					ariaLabels: {
						fileAttachmentFailed:
							"{fileName} konnte nicht hochgeladen werden: {reason}",
					},
				},
			});
			cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "Hochladen fehlgeschlagen");
			cy.get("#webchatStatusLiveRegion").should(
				"contain.text",
				"myfile.txt konnte nicht hochgeladen werden: Hochladen fehlgeschlagen",
			);
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
