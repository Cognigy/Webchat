/**
 * Speech-to-text (the microphone button in the message input).
 *
 * The real Web Speech API cannot run in CI — it needs a microphone and a
 * cloud speech service — so these specs install a fake recognizer and drive
 * it with the event sequences the real engines produce. The Edge timings and
 * its empty placeholder results below were measured against Edge 152 with a
 * real microphone while diagnosing CGY-37417; see
 * `src/webchat-ui/utils/speech-recognition.ts`.
 */

interface FakeRecognition {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onresult: ((event: unknown) => void) | null;
	onerror: ((event: unknown) => void) | null;
	onend: ((event: unknown) => void) | null;
	startCount: number;
	stopCount: number;
	abortCount: number;
	/** Replaces the pending result with `transcript`, still recognizing. */
	emitInterim: (transcript: string) => void;
	/** Finalizes the pending result. Edge sends `""` as a placeholder. */
	emitFinal: (transcript: string) => void;
	emitError: (error: string) => void;
	emitEnd: () => void;
}

declare global {
	interface Window {
		__sttRecognizers?: FakeRecognition[];
	}
}

const installFakeSpeechRecognition = (win: Window) => {
	const recognizers: FakeRecognition[] = [];

	class FakeSpeechRecognition implements FakeRecognition {
		continuous = false;
		interimResults = false;
		lang = "";
		onresult: ((event: unknown) => void) | null = null;
		onerror: ((event: unknown) => void) | null = null;
		onend: ((event: unknown) => void) | null = null;
		startCount = 0;
		stopCount = 0;
		abortCount = 0;

		private results: { 0: { transcript: string }; isFinal: boolean }[] = [];
		private index = 0;
		// The real engine stays "started" until it fires `onend`, and rejects
		// a start() before that with InvalidStateError. Tests drive the end
		// explicitly via emitEnd(), which is what makes the stop-then-start
		// window reproducible.
		private running = false;

		constructor() {
			recognizers.push(this);
		}

		start() {
			if (this.running) {
				const error = new Error("recognition has already started");
				error.name = "InvalidStateError";
				throw error;
			}
			this.running = true;
			this.startCount++;
		}

		stop() {
			this.stopCount++;
		}

		abort() {
			this.abortCount++;
		}

		private emit(transcript: string, isFinal: boolean) {
			this.results[this.index] = { 0: { transcript }, isFinal };
			this.onresult?.({ resultIndex: this.index, results: this.results });
			// A finalized result is never revised; the next utterance takes
			// the following slot.
			if (isFinal) this.index++;
		}

		emitInterim(transcript: string) {
			this.emit(transcript, false);
		}

		emitFinal(transcript: string) {
			this.emit(transcript, true);
		}

		emitError(error: string) {
			this.onerror?.({ error, message: "" });
		}

		emitEnd() {
			this.running = false;
			this.onend?.({});
		}
	}

	// Both names: the widget prefers the unprefixed constructor and falls
	// back to the webkit one, and the browser running Cypress has both.
	// @ts-expect-error overwriting the host constructor for the test
	win.SpeechRecognition = FakeSpeechRecognition;
	// @ts-expect-error overwriting the host constructor for the test
	win.webkitSpeechRecognition = FakeSpeechRecognition;
	win.__sttRecognizers = recognizers;
};

const latestRecognizer = (win: Window) => {
	const recognizers = win.__sttRecognizers ?? [];
	expect(recognizers, "a recognizer was created").to.have.length.greaterThan(0);
	return recognizers[recognizers.length - 1];
};

/** The recognizer the mounted input is holding, for driving it. */
const recognizer = () => cy.window().then(latestRecognizer);

/**
 * Asserts against the recognizer with retries. `cy.window()` is a query, so
 * Cypress re-runs this callback — unlike a `.then()`, which would read the
 * recognizer once and race React's asynchronous re-render.
 */
const recognizerShould = (assert: (rec: FakeRecognition) => void) =>
	cy.window().should(win => assert(latestRecognizer(win)));

const openWebchatWithSTT = (settings: Record<string, unknown> = {}) => {
	cy.visitWebchat();
	cy.window().then(installFakeSpeechRecognition);
	cy.initMockWebchat({
		settings: {
			behavior: { enableSTT: true },
			homeScreen: { enabled: false },
			privacyNotice: { enabled: false },
			...settings,
		},
	});
	cy.openWebchat().startConversation();
	cy.get("#webchatInputMessageSpeechButton").should("be.visible").and("not.be.disabled");
};

const micButton = () => cy.get("#webchatInputMessageSpeechButton");
const messageInput = () => cy.get(".webchat-input-message-input");

describe("Speech to text", () => {
	it("exposes the listening state on the toggle button", () => {
		openWebchatWithSTT();

		micButton().should("have.attr", "aria-pressed", "false");
		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");
		micButton().click();
		micButton().should("have.attr", "aria-pressed", "false");
	});

	// The regression from CGY-37417: the stop timer was armed at start() and
	// only a result could reset it, so any engine that took longer than 3s to
	// return its first word — Edge takes up to 6.6s — had recognition
	// cancelled out from under it, silently.
	it("keeps listening while a slow engine warms up", () => {
		openWebchatWithSTT();

		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");

		// Well past the old 3s budget, and nothing has come back yet.
		cy.wait(4500);
		micButton().should("have.attr", "aria-pressed", "true");
		recognizer().then(rec => {
			expect(rec.stopCount, "recognition was not cancelled").to.equal(0);
		});

		recognizer().then(rec => rec.emitInterim("hello i would like"));
		messageInput().should("have.value", "hello i would like");

		recognizer().then(rec => rec.emitFinal("Hello, I would like to check my application."));
		messageInput().should("have.value", "Hello, I would like to check my application.");
	});

	it("ignores the empty placeholder results Edge emits", () => {
		openWebchatWithSTT();

		micButton().click();

		// Edge sends this the moment it detects speech, seconds before the
		// first real word.
		recognizer().then(rec => rec.emitFinal(""));
		messageInput().should("have.value", "");
		micButton().should("have.attr", "aria-pressed", "true");

		recognizer().then(rec => rec.emitInterim("mortgage"));
		messageInput().should("have.value", "mortgage");

		// And another one on stop() — it must not wipe the transcript.
		recognizer().then(rec => rec.emitFinal(""));
		messageInput().should("have.value", "mortgage");
	});

	it("appends each finalized utterance to what is already typed", () => {
		openWebchatWithSTT();

		messageInput().type("Question:");
		micButton().click();

		recognizer().then(rec => rec.emitFinal("how do I reset my password"));
		messageInput().should("have.value", "Question: how do I reset my password");
	});

	// The submit guard tests `messageText`, not `text`. Testing `text` drops a
	// dictation that the user never typed a word of, as soon as that guard
	// becomes effective (its file-list half is ineffective today — CGY-37418).
	it("submits a dictation the engine has not finalized yet", () => {
		openWebchatWithSTT();

		micButton().click();
		recognizer().then(rec => rec.emitInterim("send this by voice"));
		messageInput().should("have.value", "send this by voice");

		messageInput().type("{enter}");

		cy.get(".webchat-chat-history").contains("send this by voice");

		// The engine finalizes what it heard after the submit. That
		// transcript belongs to the message already sent, so it must not
		// reappear in the input — the next Enter would send it twice.
		recognizer().then(rec => rec.emitFinal("Send this by voice."));
		cy.wait(500);
		messageInput().should("have.value", "");
	});

	it("stops listening after a pause once transcription is flowing", () => {
		openWebchatWithSTT();

		micButton().click();
		recognizer().then(rec => rec.emitFinal("that is all"));

		// TRANSCRIPT_IDLE_TIMEOUT_MS is 3s from the last transcript.
		micButton().should("have.attr", "aria-pressed", "true");
		cy.wait(3500);
		micButton().should("have.attr", "aria-pressed", "false");
		recognizer().then(rec => {
			expect(rec.stopCount).to.be.greaterThan(0);
		});
	});

	// A stop() only takes effect when the engine fires `onend`; a start()
	// before that is rejected with InvalidStateError. The click must not be
	// dropped, and the button must not claim to listen while nothing does.
	it("honours a restart requested while the engine is still stopping", () => {
		openWebchatWithSTT();

		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");

		// Stop, then start again before the engine's `onend` arrives.
		micButton().click();
		micButton().should("have.attr", "aria-pressed", "false");
		micButton().click();

		recognizerShould(rec => {
			expect(rec.startCount, "the rejected start was not counted").to.equal(1);
		});

		// The engine finally ends, and the deferred start runs.
		recognizer().then(rec => rec.emitEnd());
		micButton().should("have.attr", "aria-pressed", "true");
		recognizerShould(rec => {
			expect(rec.startCount, "the restart was honoured").to.equal(2);
		});

		recognizer().then(rec => rec.emitFinal("restarted fine"));
		messageInput().should("have.value", "restarted fine");
	});

	it("releases the microphone when the input unmounts mid-dictation", () => {
		openWebchatWithSTT();

		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");

		// Closing the webchat unmounts the chat window, and with it the input.
		cy.get<{ close: () => void; open: () => void }>("@webchat").then(webchat => {
			webchat.close();
		});
		cy.get("#webchatInputMessageSpeechButton").should("not.exist");

		recognizerShould(rec => {
			expect(rec.abortCount, "the engine was aborted, not left running").to.be.greaterThan(0);
		});

		// `sttActive` lives in the store, which outlived the component: the
		// button must not come back looking like it is listening.
		cy.get<{ close: () => void; open: () => void }>("@webchat").then(webchat => {
			webchat.open();
		});
		micButton().should("have.attr", "aria-pressed", "false");
	});

	it("reconciles the button when the engine ends on its own", () => {
		openWebchatWithSTT();

		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");

		recognizer().then(rec => rec.emitEnd());
		micButton().should("have.attr", "aria-pressed", "false");
	});

	it("applies an STT language that arrives after the input mounted", () => {
		openWebchatWithSTT();

		// The endpoint config is fetched asynchronously, so STTLanguage
		// normally lands after this component's constructor has run. Applying
		// it used to replace the recognizer with a plain object, breaking
		// every later start() (CGY-37417).
		cy.get<{ updateSettings: (settings: Record<string, unknown>) => void }>("@webchat").then(
			webchat => {
				webchat.updateSettings({ widgetSettings: { STTLanguage: "de-DE" } });
			},
		);

		recognizerShould(rec => {
			expect(rec.lang).to.equal("de-DE");
		});

		micButton().click();
		micButton().should("have.attr", "aria-pressed", "true");
		recognizer().then(rec => {
			expect(rec.startCount, "the recognizer still works").to.equal(1);
		});
		recognizer().then(rec => rec.emitFinal("Guten Tag"));
		messageInput().should("have.value", "Guten Tag");
	});

	describe("failures are reported instead of silent", () => {
		it("explains a blocked microphone", () => {
			openWebchatWithSTT();

			micButton().click();
			recognizer().then(rec => rec.emitError("not-allowed"));

			cy.get(".webchat-toast-notification").should("contain.text", "Microphone access");
			micButton().should("have.attr", "aria-pressed", "false");
		});

		it("explains an unreachable speech service", () => {
			openWebchatWithSTT();

			micButton().click();
			recognizer().then(rec => rec.emitError("network"));

			cy.get(".webchat-toast-notification").should(
				"contain.text",
				"Speech input is currently unavailable",
			);
			micButton().should("have.attr", "aria-pressed", "false");
		});

		it("says so when nothing at all was recognized", () => {
			openWebchatWithSTT();

			// FIRST_TRANSCRIPT_TIMEOUT_MS is 15s, so drive the clock rather
			// than wait it out.
			cy.clock(undefined, ["setTimeout", "clearTimeout"]);
			micButton().click();
			cy.tick(15100);

			cy.get(".webchat-toast-notification").should("contain.text", "No speech was detected");
			micButton().should("have.attr", "aria-pressed", "false");
		});

		it("explains a missing microphone", () => {
			openWebchatWithSTT();

			micButton().click();
			recognizer().then(rec => rec.emitError("audio-capture"));

			cy.get(".webchat-toast-notification").should("contain.text", "No microphone was found");
			micButton().should("have.attr", "aria-pressed", "false");
		});

		it("does not report a failure after the user stopped on their own", () => {
			openWebchatWithSTT();

			cy.clock(undefined, ["setTimeout", "clearTimeout"]);
			micButton().click();
			micButton().click();
			micButton().should("have.attr", "aria-pressed", "false");

			// Past the warm-up budget: the timer the user's stop cancelled
			// must not fire and claim nothing was heard.
			cy.tick(15100);
			cy.get(".webchat-toast-notification").should("not.exist");
		});

		it("uses the configured translation for a failure message", () => {
			openWebchatWithSTT({
				customTranslations: {
					speech_recognition_not_allowed: "Mikrofonzugriff ist blockiert.",
				},
			});

			micButton().click();
			recognizer().then(rec => rec.emitError("not-allowed"));

			cy.get(".webchat-toast-notification").should(
				"contain.text",
				"Mikrofonzugriff ist blockiert.",
			);
		});

		it("announces the failure to screen readers", () => {
			openWebchatWithSTT();

			micButton().click();
			recognizer().then(rec => rec.emitError("not-allowed"));

			// Toasts are silenced at the source and mirrored here, so this is
			// the only announcement a screen reader gets (SC 4.1.3).
			cy.get("#webchatStatusLiveRegion").should("contain.text", "Microphone access");
		});
	});

	// Accessibility (WCAG 2.2 AA) — scoped to the widget root. See docs/accessibility.md.
	describe("Accessibility (WCAG 2.2 AA)", () => {
		it("idle microphone button has no detectable a11y violations", () => {
			openWebchatWithSTT();

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("listening state has no detectable a11y violations", () => {
			openWebchatWithSTT();

			micButton().click();
			micButton().should("have.attr", "aria-pressed", "true");
			cy.get(".webchat-input-button-speech-background").should("exist");

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});

		it("failure notification has no detectable a11y violations", () => {
			openWebchatWithSTT();

			micButton().click();
			recognizer().then(rec => rec.emitError("not-allowed"));
			cy.get(".webchat-toast-notification").should("be.visible");

			cy.checkA11yCompliance("[data-cognigy-webchat-root]");
		});
	});
});
