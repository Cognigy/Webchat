describe("Persistent History", () => {
	it("restores a persistent history from LocalStorage", () => {
		cy.session("default1", () => {
			const localOptions = {
				userId: `user-1`,
				sessionId: `session-1`,
				channel: `channel-1`,
				URLToken: "fake-url-token",
			};

			cy.window().then(window => {
				window.localStorage.clear();
			});

			cy.visitWebchat();
			cy.initWebchat(localOptions).openWebchat().startConversation();
			cy.sendMessage("hello");
			cy.contains('You said "hello".').should("be.visible");

			cy.reload();

			cy.window().then(window => {
				expect(window.localStorage.length).to.greaterThan(0);
				expect(window.sessionStorage.length).to.equal(0);
			});
		});
	});

	it("restores a persisted history from SessionStorage when using useSessionStorage", () => {
		cy.session("default2", () => {
			const options = {
				userId: `user-${Math.floor(Math.random() * Date.now())}`,
				sessionId: `session-${Math.floor(Math.random() * Date.now())}`,
				channel: `channel-${Math.floor(Math.random() * Date.now())}`,
				settings: {
					embeddingConfiguration: {
						useSessionStorage: true,
					},
				},
			};

			cy.visitWebchat();

			cy.window().then(window => {
				window.localStorage.clear();
			});

			cy.window().then(window => {
				expect(window.localStorage.length).to.equal(0);
				expect(window.sessionStorage.length).to.equal(0);
			});
			cy.initWebchat(options).openWebchat().startConversation();

			cy.sendMessage("hello");

			cy.contains('You said "hello".').should("be.visible");
			cy.reload();

			cy.window().then(window => {
				expect(window.sessionStorage.length).to.greaterThan(0);
				expect(window.localStorage.length).to.equal(0);
			});
		});
	});

	/**
	 * The stored conversation is restored when the first connect sets the
	 * session options. A message sent before that (the input works while the
	 * socket is still connecting) must not stop the restore, or the next save
	 * overwrites the stored conversation with only the new messages (CGY-48210).
	 */
	describe("message sent before the first connect", () => {
		const socketOptions = {
			userId: "early-send-user",
			sessionId: "early-send-session",
			channel: "early-send-channel",
		};
		// Same key layout as getOptionsKey; the URLToken is the mocked endpoint's.
		const storageKey = JSON.stringify([
			"webchat-client",
			socketOptions.userId,
			socketOptions.sessionId,
			"fake-url-token",
		]);
		const storedConversation = {
			messages: [
				{ text: "old question", source: "user", id: "old-1", timestamp: 1700000000000 },
				{
					text: "old answer",
					source: "bot",
					id: "old-2",
					data: {},
					timestamp: 1700000001000,
				},
			],
			rating: { hasGivenRating: false, showRatingScreen: false },
		};
		const expectedTexts = ["old question", "old answer", "new question", "new answer"];

		// progressive rendering stores bot text as an array of chunks
		const textsOf = (messages: { text?: string | string[] }[]) =>
			messages.map(message =>
				Array.isArray(message.text) ? message.text.join("") : message.text,
			);

		[false, true].forEach(enableInputCollation => {
			it(`keeps the stored conversation with input collation ${enableInputCollation ? "on" : "off"}`, () => {
				cy.visitWebchat();
				cy.window().then(window => {
					window.localStorage.clear();
					window.localStorage.setItem(storageKey, JSON.stringify(storedConversation));
				});

				// An unroutable endpoint keeps the socket closed until the test connects it.
				cy.initMockWebchat(
					{ ...socketOptions, settings: { layout: { enableInputCollation } } },
					undefined,
					"http://mock-endpoint.invalid/asdfqwer",
				)
					.openWebchat()
					.startConversation();
				cy.getWebchat().then(webchat => {
					cy.stub(webchat.client, "sendMessage").as("sendMessage");
				});

				cy.get(".webchat-input-message-input").type("new question{enter}");
				// What a successful connect does (connection-middleware): set the session options.
				cy.getWebchat().then(webchat => {
					webchat.store.dispatch({ type: "SET_OPTIONS", options: socketOptions });
				});
				cy.get("@sendMessage").should("have.been.calledOnceWith", "new question", null);
				cy.receiveMessage("new answer");

				cy.getHistory().then(history => {
					expect(textsOf(history)).to.deep.equal(expectedTexts);
				});
				cy.window().then(window => {
					const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}");
					expect(textsOf(stored.messages ?? [])).to.deep.equal(expectedTexts);
				});
			});
		});

		it("does not repeat a conversation opened by a session switch", () => {
			cy.visitWebchat();
			cy.window().then(window => {
				window.localStorage.clear();
				window.localStorage.setItem(storageKey, JSON.stringify(storedConversation));
			});
			cy.initMockWebchat(
				{ userId: socketOptions.userId },
				undefined,
				"http://mock-endpoint.invalid/asdfqwer",
			)
				.openWebchat()
				.startConversation();

			cy.getWebchat().then(webchat => {
				// keep the switch pending; the test finishes it below
				cy.stub(webchat.client, "switchSession").returns(new Promise(() => {}));
				webchat.store.dispatch({
					type: "SWITCH_SESSION",
					sessionId: socketOptions.sessionId,
					conversation: storedConversation,
				});
				webchat.store.dispatch({ type: "SET_OPTIONS", options: socketOptions });
			});

			cy.getHistory().then(history => {
				expect(textsOf(history)).to.deep.equal(["old question", "old answer"]);
			});
		});
	});
});
