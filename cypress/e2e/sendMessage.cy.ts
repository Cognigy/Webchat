describe("Send Message", () => {
	it("send message button should have correct aria-label", () => {
		cy.visitWebchat()
			.initMockWebchat()
			.openWebchat()
			.startConversation()
			.get('[aria-label="Send message"]')
			.should("be.visible");
	});

	it("should be possible to type and send message", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
		cy.get(".webchat-input-message-label")
			.contains("label", "Type something here…")
			.invoke("attr", "for")
			.then(inputId => {
				cy.get(`#${inputId}`).type("Hi");
			})
			.get('[aria-label="Send message"]')
			.click()
			.get(".webchat-chat-history")
			.contains("Hi");
	});

	it("should not send messages without text and data", () => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();

		cy.wait(1000);

		cy.sendMessage();
		cy.sendMessage("");
		cy.sendMessage("", {});

		cy.getHistory().then(history => {
			expect(history.length).to.equal(0);
		});
	});
});

/**
 * Regression tests for the empty-input submit guard in `BaseInput.handleSubmit`.
 *
 * The guard read `if (!text && !fileList) return;`. `fileList` is always an array
 * (the input reducer defaults it to `[]`), so `!fileList` was never true and the
 * guard could never short-circuit. The Send button is correctly `disabled` while
 * `text === "" && isFileListEmpty`, but `handleInputKeyDown` calls `handleSubmit`
 * directly on Enter regardless of the button state — so pressing Enter in an empty
 * input dispatched `SEND_MESSAGE` with an empty message.
 *
 * The message middleware drops empty messages before they reach the socket, so the
 * chat history stayed clean. The analytics middleware, however, runs *first* in the
 * chain and emitted a `webchat/outgoing-message` event for every such phantom send.
 * That event is what these tests assert on.
 */
describe("Send Message — empty input submit guard", () => {
	type AnalyticsEvent = { type: string; payload?: any };

	const INPUT = "textarea.webchat-input-message-input";

	/** Record every analytics event emitted from now on. */
	const collectEvents = (events: AnalyticsEvent[]) =>
		cy.getWebchat().then((webchat: any) => {
			webchat.registerAnalyticsService((event: AnalyticsEvent) => events.push(event));
		});

	const outgoing = (events: AnalyticsEvent[]) =>
		events.filter(event => event.type === "webchat/outgoing-message");

	beforeEach(() => {
		cy.visitWebchat().initMockWebchat().openWebchat().startConversation();
	});

	/**
	 * Rather than pressing Enter and waiting out a fixed delay to prove a negative,
	 * follow the empty submits with a real message and gate on *that* arriving. The
	 * phantom events would have been emitted synchronously on the earlier Enter
	 * keypresses, so once the real message has landed the collector is complete.
	 */
	it("sends nothing when Enter is pressed on an empty input", () => {
		const events: AnalyticsEvent[] = [];
		collectEvents(events);

		cy.get(INPUT).click().type("{enter}{enter}{enter}");

		// the sentinel: a genuine send, which must be the only outgoing message
		cy.get(INPUT).type("Hi{enter}");
		cy.getMessageFromHistory({ text: "Hi", source: "user" });

		cy.then(() => {
			expect(outgoing(events).map(event => event.payload?.text)).to.deep.equal(["Hi"]);
		});

		cy.getHistory().then(history => {
			expect(history.length).to.equal(1);
		});
	});

	it("keeps the Send button disabled while the input is empty", () => {
		cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");

		cy.get(INPUT).type("Hi");
		cy.get("#webchatInputMessageSendMessageButton").should("not.be.disabled");

		// clearing the text disables it again
		cy.get(INPUT).clear();
		cy.get("#webchatInputMessageSendMessageButton").should("be.disabled");
	});

	it("still sends on Enter when only a file is attached and there is no text", () => {
		const attachment = {
			runtimeFileId: "runtime-file-1",
			fileName: "myfile.txt",
			mimeType: "text/plain",
			size: 13,
			url: "https://storage.example/myfile.txt",
		};

		// A successful upload cannot be driven end-to-end against the mock endpoint,
		// so seed the already-uploaded file into the input state the way the file
		// upload middleware would, then submit through the real Enter key path.
		cy.window().then(win => {
			// construct the File in the application realm, not the Cypress one
			const file = new (win as any).File(["file contents"], attachment.fileName, {
				type: attachment.mimeType,
			});

			cy.getWebchat().then((webchat: any) => {
				webchat.store.dispatch({
					type: "SET_FILE_LIST",
					fileList: [{ file, uploadFileMeta: attachment }],
				});
			});
		});

		cy.get("#filePreview0").should("exist");
		cy.get(INPUT).click().type("{enter}");

		cy.getMessageFromHistory(
			(message: any) =>
				message.source === "user" &&
				!message.text &&
				message.data?.attachments?.length === 1 &&
				message.data.attachments[0].fileName === attachment.fileName,
		);
	});
});
