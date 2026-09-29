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
		cy.get("#filePreview0 button").click();
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

	// Regression (PR #447, 3.0.0): the chips shrank into a single row, collapsing
	// the file names and then clipping the sizes. The row now wraps, and past
	// three rows the area scrolls vertically.
	it("many attachments keep their file names readable by wrapping, capped at three rows", () => {
		cy.initMockWebchat({
			settings: {
				homeScreen: { enabled: false },
				fileStorageSettings: { enabled: true },
			},
		});
		cy.intercept("GET", "**/fileuploadtoken", {
			body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
		});
		cy.intercept("POST", "**/mock-upload", {
			body: {
				runtimeFileId: "mock-file-id",
				status: "scanned",
				mimeType: "text/plain",
				size: 13,
			},
		});
		cy.openWebchat().startConversation();

		const fileNames = Array.from({ length: 8 }, (_, i) => `document-${i + 1}.pdf`);
		cy.get("input[type=file]").selectFile(
			fileNames.map(fileName => ({
				contents: Cypress.Buffer.from("file contents"),
				fileName,
				mimeType: "text/plain",
				lastModified: Date.now(),
			})),
			{ force: true },
		);
		cy.get("#filePreview7").should("contain.text", "document-8.pdf");

		// Every chip keeps its natural width (the name span is not collapsed) …
		fileNames.forEach((fileName, i) => {
			cy.get(`#filePreview${i}`)
				.contains("span", fileName)
				.then($name => {
					expect(
						$name[0].getBoundingClientRect().width,
						`${fileName} width`,
					).to.be.greaterThan(60);
				});
		});
		// … because the row wraps: no horizontal overflow, several chip rows, and
		// beyond three rows the area scrolls vertically instead of growing further.
		cy.get("#filePreview0")
			.parent()
			.then($area => {
				const area = $area[0];
				expect(area.scrollWidth, "no horizontal overflow").to.equal(area.clientWidth);
				const tops = new Set(
					Array.from(area.children).map(chip =>
						Math.round(chip.getBoundingClientRect().top),
					),
				);
				expect(tops.size, "number of chip rows").to.be.greaterThan(3);
				expect(area.clientHeight, "visible height (3 rows)").to.be.at.most(3 * 33 + 2 * 12);
				expect(area.scrollHeight, "scrollable").to.be.greaterThan(area.clientHeight);
				expect(getComputedStyle(area).overflowY).to.equal("auto");
			});

		// the wrapped, scrolling attachment area is a changed surface
		cy.checkA11yCompliance("[data-cognigy-webchat-root]");
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
				cy.get("#filePreview0 button").click();
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

		// Wait until each chip has dropped its progress bar (100%).
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
						fileAttachmentRemoved: "{fileName} entfernt",
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
			cy.get("#filePreview0 button").should(
				"have.attr",
				"aria-label",
				"Anhang entfernen 1, myfile.txt",
			);
			waitForUploadsToSettle(1);
			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt entfernt");
		});

		it("queued attachments have no detectable a11y violations and each remove button is named by position", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt", "second.txt"]);
			cy.get("#filePreview0").should("contain.text", "myfile.txt");
			cy.get("#filePreview1").should("contain.text", "second.txt");

			// named by position and file name — the chip text is not part of the name
			cy.get("#filePreview0 button")
				.should("match", "button")
				.and("have.attr", "aria-label", "Remove file attachment 1, myfile.txt");
			cy.get("#filePreview1 button")
				.should("match", "button")
				.and("have.attr", "aria-label", "Remove file attachment 2, second.txt");
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

		it("announces a file rejected by the malware scan with the chip reason and disables Send", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", {
				body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
			});
			cy.intercept("POST", "**/mock-upload", {
				body: {
					runtimeFileId: "mock-file-id",
					status: "infected",
					mimeType: "text/plain",
					size: 13,
				},
			});
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "Infected File");
			cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt: Infected File");
		});

		it("announces an upload whose POST fails (token succeeded) as Upload Failed", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", {
				body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
			});
			cy.intercept("POST", "**/mock-upload", { statusCode: 500, body: {} });
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "Upload Failed");
			cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt: Upload Failed");
		});

		it("honors the configurable success, count, oversized and infected texts", () => {
			initWithFileStorage({
				fileAttachmentMaxSize: 1024 * 1024,
				customTranslations: {
					file_upload_too_large: "Datei größer als {maxSizeInMb} MB",
					file_upload_infected: "Infizierte Datei",
					ariaLabels: {
						fileAttachmentUploaded: "{fileName} angehängt",
						fileAttachmentsUploaded: "{count} Dateien angehängt",
						fileAttachmentFailed: "{fileName}: {reason}",
					},
				},
			});
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			// one success
			selectFiles(["myfile.txt"]);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt angehängt");
			waitForUploadsToSettle(1);
			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");

			// several successes -> count
			selectFiles(["a.txt", "b.txt"]);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "2 Dateien angehängt");
			waitForUploadsToSettle(2);
			cy.get("#filePreview1 button").click();
			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");

			// oversized -> interpolated size limit in the chip and the announcement
			cy.get("input[type=file]").selectFile(
				{
					contents: Cypress.Buffer.alloc(2 * 1024 * 1024),
					fileName: "big.bin",
					mimeType: "application/octet-stream",
					lastModified: Date.now(),
				},
				{ force: true },
			);
			cy.get("#filePreview0").should("contain.text", "Datei größer als 1 MB");
			cy.get("#webchatStatusLiveRegion").should(
				"contain.text",
				"big.bin: Datei größer als 1 MB",
			);
			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");

			// infected
			cy.intercept("POST", "**/mock-upload", {
				body: {
					runtimeFileId: "mock-file-id",
					status: "infected",
					mimeType: "text/plain",
					size: 13,
				},
			});
			selectFiles(["virus.txt"]);
			cy.get("#filePreview0").should("contain.text", "Infizierte Datei");
			cy.get("#webchatStatusLiveRegion").should(
				"contain.text",
				"virus.txt: Infizierte Datei",
			);
		});

		// Outcomes are tracked per File object: a file attached again after the
		// previous message was sent is a new File and must be announced again.
		it("announces an attachment again when a same-named file is attached after sending", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt attached");
			waitForUploadsToSettle(1);
			cy.get("#webchatStatusLiveRegion > div").then($first => {
				cy.get("#webchatInputMessageSendMessageButton").click();
				cy.get("#filePreview0").should("not.exist");

				selectFiles(["myfile.txt"]);
				// a new announcement node, not the stale one still displayed
				cy.get("#webchatStatusLiveRegion > div").should($now => {
					expect($now).to.have.length(1);
					expect($now[0]).not.to.equal($first[0]);
					expect($now.text()).to.contain("myfile.txt attached");
				});
			});
		});

		// A long name is truncated with an ellipsis inside a capped chip rather
		// than stretching the chip (the chip keeps its 200px maximum).
		it("truncates a long file name inside the chip instead of stretching it", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			const longName = "a-very-long-quarterly-financial-report-final-v3.pdf";
			selectFiles([longName]);
			cy.get("#filePreview0")
				.should("contain.text", longName)
				.then($chip => {
					expect($chip[0].getBoundingClientRect().width).to.be.at.most(200);
				});
			cy.get("#filePreview0")
				.contains("span", longName)
				.then($name => {
					expect(getComputedStyle($name[0]).textOverflow).to.equal("ellipsis");
					expect($name[0].scrollWidth, "name is truncated").to.be.greaterThan(
						$name[0].clientWidth,
					);
				});
		});

		// SC 4.1.3: the chip disappearing is the only visible feedback of a removal.
		it("removing an attachment is announced through the status live region", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0").should("contain.text", "myfile.txt");
			waitForUploadsToSettle(1);

			cy.get("#filePreview0 button").click();
			cy.get("#filePreview0").should("not.exist");
			cy.get("#webchatStatusLiveRegion").should("contain.text", "myfile.txt removed");
		});

		// Regression: the middleware used to re-dispatch its captured file list
		// (+100ms and once the uploads settled), resurrecting a chip removed while
		// its upload was in flight — and, with this PR, announcing it as attached
		// right after it had been announced as removed.
		it("a chip removed while its upload is in flight stays removed and is not announced as attached", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", {
				body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
			});
			cy.intercept("POST", "**/mock-upload", req => {
				req.reply({
					delay: 1500,
					body: {
						runtimeFileId: "mock-file-id",
						status: "scanned",
						mimeType: "text/plain",
						size: 13,
					},
				});
			}).as("slowUpload");
			cy.openWebchat().startConversation();

			selectFiles(["keep.txt", "drop.txt"]);
			cy.get("#filePreview1").should("contain.text", "drop.txt");
			// still uploading: the progress bar is the chip's second child
			cy.get("#filePreview1 > div").should("have.length", 2);
			cy.get("#filePreview1 button").click();
			cy.get("#webchatStatusLiveRegion").should("contain.text", "drop.txt removed");

			cy.wait("@slowUpload");
			// give the settle dispatch time to land, then assert nothing came back
			cy.get("#filePreview0 > div").should("have.length", 1);
			cy.get("#filePreview1").should("not.exist");
			cy.get("#filePreview0").should("contain.text", "keep.txt");
			cy.get("#webchatStatusLiveRegion")
				.should("contain.text", "keep.txt attached")
				.and("not.contain.text", "drop.txt attached");
			cy.get("#webchatInputMessageSendMessageButton").should("not.be.disabled");
		});

		it("a message sent while an upload is in flight does not get its chips back", () => {
			initWithFileStorage();
			cy.intercept("GET", "**/fileuploadtoken", {
				body: { fileUploadUrl: "/mock-upload", token: "mock-token" },
			});
			cy.intercept("POST", "**/mock-upload", req => {
				req.reply({
					delay: 1500,
					body: {
						runtimeFileId: "mock-file-id",
						status: "scanned",
						mimeType: "text/plain",
						size: 13,
					},
				});
			}).as("slowUpload");
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			cy.get("#filePreview0 > div").should("have.length", 2);
			cy.get("#webchatInputMessageInputInTextMode").type("hello{enter}");
			cy.get("#filePreview0").should("not.exist");

			cy.wait("@slowUpload");
			cy.wait(300);
			cy.get("#filePreview0").should("not.exist");
		});

		// With the persistent menu open, BaseInput renders the menu instead of the
		// attach button / input row; the hand-off then targets the menu toggle.
		itChromiumOnly(
			"removing the last chip while the persistent menu is open moves focus to the menu toggle",
			() => {
				initWithFileStorage({
					layout: {
						enablePersistentMenu: true,
						persistentMenu: {
							title: "Chat menu",
							menuItems: [{ title: "Option 1", payload: "option 1" }],
						},
					},
				});
				mockSuccessfulUpload();
				cy.openWebchat().startConversation();

				selectFiles(["myfile.txt"]);
				waitForUploadsToSettle(1);
				cy.get("#webchatInputButtonMenu").click();
				cy.get("#webchatInputButtonMenu").should("have.attr", "aria-expanded", "true");
				cy.get("#webchatInputMessageAttachFileButton").should("not.exist");

				cy.get("#filePreview0 button").focus();
				cy.realPress("Enter");
				cy.get("#filePreview0").should("not.exist");
				cy.focused().should("have.id", "webchatInputButtonMenu");
			},
		);

		// SC 2.4.3: removing a chip unmounts the focused remove button; focus must
		// not drop to <body>. It moves to the neighbouring chip's remove button
		// (the one taking the removed chip's position, or the previous one when
		// the last chip went) and to the attach button once the list is empty.
		itChromiumOnly(
			"removing an attachment with the keyboard moves focus to the neighbouring chip, then to the attach button",
			() => {
				initWithFileStorage();
				mockSuccessfulUpload();
				cy.openWebchat().startConversation();

				selectFiles(["first.txt", "second.txt", "third.txt"]);
				cy.get("#filePreview2").should("contain.text", "third.txt");
				waitForUploadsToSettle(3);

				// last chip removed -> previous chip's remove button
				cy.get("#filePreview2 button")
					.should("have.attr", "aria-label", "Remove file attachment 3, third.txt")
					.focus();
				cy.realPress("Enter");
				cy.get("#filePreview2").should("not.exist");
				cy.focused().should(
					"have.attr",
					"aria-label",
					"Remove file attachment 2, second.txt",
				);
				cy.get("#webchatStatusLiveRegion").should("contain.text", "third.txt removed");

				// first chip removed -> the chip that took its position
				cy.get("#filePreview0 button").focus();
				cy.realPress("Enter");
				cy.get("#filePreview1").should("not.exist");
				cy.get("#filePreview0").should("contain.text", "second.txt");
				cy.focused().should(
					"have.attr",
					"aria-label",
					"Remove file attachment 1, second.txt",
				);
				cy.get("#webchatStatusLiveRegion").should("contain.text", "first.txt removed");

				// only chip removed -> attach button
				cy.realPress("Enter");
				cy.get("#filePreview0").should("not.exist");
				cy.focused().should("have.id", "webchatInputMessageAttachFileButton");
				cy.get("#webchatStatusLiveRegion").should("contain.text", "second.txt removed");
			},
		);

		// SC 2.4.7 / 1.4.11: keyboard focus on a remove button is shown as two
		// rings (primary focus variant + its contrast colour) on the button itself.
		// The chip background must not change, so its size / error texts keep
		// their idle contrast — axe runs with the button focused to prove it.
		itChromiumOnly(
			"remove button shows a two-ring focus indicator and the focused chip stays a11y-clean",
			() => {
				initWithFileStorage();
				cy.intercept("GET", "**/fileuploadtoken", { forceNetworkError: true });
				cy.openWebchat().startConversation();

				selectFiles(["myfile.txt"]);
				cy.get("#filePreview0").should("contain.text", "Upload Failed");
				cy.get("#filePreview0").then($chip => {
					const idleBackground = getComputedStyle($chip[0]).backgroundColor;

					// Tab from the send button lands on the first remove button
					cy.get("#webchatInputMessageSendMessageButton").focus();
					cy.realPress("Tab");
					cy.focused()
						.should("have.attr", "aria-label", "Remove file attachment 1, myfile.txt")
						.then($button => {
							const style = getComputedStyle($button[0]);
							expect(style.outlineStyle, "outer ring").to.equal("solid");
							expect(style.outlineWidth, "outer ring width").to.equal("2px");
							expect(style.boxShadow, "inner ring").to.match(/0px 0px 0px 2px/);
							expect(style.outlineColor, "rings differ").not.to.equal(
								style.boxShadow.match(/rgba?\([^)]+\)/)?.[0],
							);
						});
					cy.get("#filePreview0").should($focusedChip => {
						expect(getComputedStyle($focusedChip[0]).backgroundColor).to.equal(
							idleBackground,
						);
					});
					cy.checkA11yCompliance("[data-cognigy-webchat-root]");
				});
			},
		);

		// The focus hand-off only applies when the removed button held focus: a
		// removal triggered while focus is elsewhere must not move it.
		it("does not move focus on removal when the remove button did not have focus", () => {
			initWithFileStorage();
			mockSuccessfulUpload();
			cy.openWebchat().startConversation();

			selectFiles(["myfile.txt"]);
			waitForUploadsToSettle(1);

			cy.get("#webchatInputMessageInputInTextMode").focus();
			// a native click does not focus the button (unlike cy.click)
			cy.get("#filePreview0 button").then($button => $button[0].click());
			cy.get("#filePreview0").should("not.exist");
			cy.focused().should("have.id", "webchatInputMessageInputInTextMode");
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

				cy.get("[aria-label='Remove file attachment 2, second.txt']").focus();
				cy.realPress("Enter");
				cy.get("#filePreview1").should("not.exist");
				cy.get("#filePreview0").should("contain.text", "myfile.txt");
			},
		);
	});
});
