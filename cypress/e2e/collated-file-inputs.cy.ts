/**
 * Regression tests for AB#106774 — "File Upload Issue with input collation enabled".
 *
 * When input collation is enabled, the collation middleware used to rebuild the
 * collated message with `data: undefined`, which discarded the uploaded file
 * attachments (`data.attachments`). As a result no file payload reached the flow.
 * These tests assert that attachments survive collation.
 *
 * Each collated input is shown right away as its own message (CGY-48210); the
 * flow receives one input with every attachment, read from `client.sendMessage`.
 */

// The parts of the Webchat instance these tests use.
type WebchatHandle = {
	client: { sendMessage: (text: string, data: object | null) => void };
};

// Makes this file a module, so the type above does not clash with other specs.
export {};

describe("collated file inputs", () => {
	const fileAttachment = {
		runtimeFileId: "runtime-file-1",
		fileName: "myfile.txt",
		mimeType: "text/plain",
		size: 13,
		url: "https://storage.example/myfile.txt",
	};

	const secondAttachment = {
		runtimeFileId: "runtime-file-2",
		fileName: "myfile2.txt",
		mimeType: "text/plain",
		size: 14,
		url: "https://storage.example/myfile2.txt",
	};

	const initCollationWebchat = () =>
		cy
			.initMockWebchat({
				settings: {
					layout: {
						enableInputCollation: true,
					},
				},
			})
			.openWebchat()
			.startConversation()
			.then(webchat => {
				cy.stub((webchat as unknown as WebchatHandle).client, "sendMessage").as(
					"sendMessage",
				);
			});

	beforeEach(() => {
		cy.visitWebchat();
	});

	it("keeps file attachments on the submitted message when collation is enabled", () => {
		initCollationWebchat();

		cy.sendMessage("here is the file", { attachments: [fileAttachment] }, "user", {
			collate: true,
		});

		cy.getMessageFromHistory(
			(message: any) =>
				message.source === "user" &&
				message.text === "here is the file" &&
				message.data?.attachments?.length === 1 &&
				message.data.attachments[0].fileName === "myfile.txt",
		);
		cy.get("@sendMessage").should("have.been.calledOnceWith", "here is the file", {
			attachments: [fileAttachment],
		});
	});

	it("keeps attachments for an attachment-only message (no text)", () => {
		initCollationWebchat();

		cy.sendMessage("", { attachments: [fileAttachment] }, "user", { collate: true });

		cy.getMessageFromHistory(
			(message: any) => message.source === "user" && message.data?.attachments?.length === 1,
		);
		cy.get("@sendMessage").should("have.been.calledOnceWith", "", {
			attachments: [fileAttachment],
		});
	});

	it("merges attachments from multiple collated inputs into a single message", () => {
		initCollationWebchat();

		// text typed first, then a file uploaded within the collation window:
		// the attachment lives in a *later* buffered message and must not be lost.
		cy.sendMessage("look", undefined, "user", { collate: true });
		cy.sendMessage("at this", { attachments: [fileAttachment, secondAttachment] }, "user", {
			collate: true,
		});

		cy.get("@sendMessage").should("have.been.calledOnceWith", "look at this", {
			attachments: [fileAttachment, secondAttachment],
		});

		// one message per input in the chat, attachments on the input that carried them
		cy.getHistory().then(history => {
			const userMessages = history.filter((message: any) => message.source === "user");
			expect(userMessages.map((message: any) => message.text)).to.deep.equal([
				"look",
				"at this",
			]);
			expect((userMessages[1] as any).data.attachments).to.have.length(2);
		});
	});
});
