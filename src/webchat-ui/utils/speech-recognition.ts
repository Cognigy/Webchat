import { IWebchatSettings } from "../../common/interfaces/webchat-config";

/**
 * Web Speech API plumbing for the message input's speech-to-text button.
 *
 * The spec says nothing about latency, and engines differ by seconds — which
 * is what CGY-37417 turned out to be. Measured on macOS with a real
 * microphone, one spoken sentence, `continuous`/`interimResults` both on:
 *
 * | event                       | Chrome 152 | Edge 152      |
 * | --------------------------- | ---------- | ------------- |
 * | `audiostart` after `start()`| 0.55 s     | 0.52 s        |
 * | `speechstart` -> 1st result | 0.00 s     | 0.32 - 4.25 s |
 * | `start()` -> 1st transcript | 1.37 s     | 5.02 - 6.65 s |
 *
 * Chrome streams an interim result in the same tick as `speechstart`; Edge
 * buffers whole phrases against its cloud service and can take over six
 * seconds to hand back the first word. Edge also emits *placeholder* results
 * — `isFinal` with an empty transcript — when speech starts and again on
 * `stop()`, which Chrome never does. Any timing budget here has to hold for
 * the slow engine, and any result handler has to tolerate empty transcripts.
 */

/**
 * How long to wait after `start()` for the engine's first transcript before
 * giving up and telling the user nothing was heard.
 *
 * This has to cover the permission prompt (on first use the clock is already
 * running while the user hunts for the browser's "Allow" button), the
 * engine's connection to its speech service, the user pausing to collect
 * their thoughts, and then the engine's own recognition latency — 6.65 s of
 * it on Edge. The previous budget was 3 s counted from `start()`, so on Edge
 * recognition was routinely cancelled before it had produced a single word,
 * and the failure was silent (CGY-37417).
 */
export const FIRST_TRANSCRIPT_TIMEOUT_MS = 15000;

/**
 * How long to keep listening after the last transcript before auto-stopping,
 * so the user doesn't have to press the button a second time.
 *
 * Only armed once the engine has actually produced a transcript, which is
 * what makes 3 s safe: while speech is flowing, consecutive results arrive
 * ~0.2 - 0.7 s apart on both engines. Before the first transcript,
 * FIRST_TRANSCRIPT_TIMEOUT_MS applies instead.
 */
export const TRANSCRIPT_IDLE_TIMEOUT_MS = 3000;

/** Reasons recognition can fail, beyond the spec's own error codes. */
export type SpeechRecognitionFailure =
	| SpeechRecognitionErrorCode
	/** `start()` threw, so the engine never began listening. */
	| "start-failed"
	/** Our own FIRST_TRANSCRIPT_TIMEOUT_MS elapsed with nothing recognized. */
	| "no-transcript";

/**
 * Creates a recognizer, or `null` where the browser has no Web Speech API
 * (Firefox, and WebViews that drop it). Callers treat `null` as
 * "speech-to-text unsupported" and disable the button.
 */
export const createSpeechRecognition = (): SpeechRecognition | null => {
	const Recognition =
		typeof SpeechRecognition !== "undefined"
			? SpeechRecognition
			: typeof webkitSpeechRecognition !== "undefined"
				? webkitSpeechRecognition
				: null;

	if (!Recognition) return null;

	try {
		return new Recognition();
	} catch {
		// Constructing can still throw where the API is present but disabled
		// by policy or an unsupported embedding context.
		return null;
	}
};

/**
 * Maps a failure onto the message shown to the user, so a failed dictation
 * says what went wrong and what to do instead of failing silently
 * (SC 3.3.1 Error Identification).
 */
export const getSpeechRecognitionErrorMessage = (
	failure: SpeechRecognitionFailure,
	customTranslations?: IWebchatSettings["customTranslations"],
): string => {
	switch (failure) {
		// The user (or a policy) blocked the microphone. Only they can undo
		// it, and only in browser settings — the prompt won't come back.
		case "not-allowed":
		case "service-not-allowed":
			return (
				customTranslations?.speech_recognition_not_allowed ??
				"Microphone access is blocked. Allow it in your browser settings to use speech input."
			);

		case "audio-capture":
			return (
				customTranslations?.speech_recognition_no_microphone ??
				"No microphone was found. Connect one to use speech input."
			);

		case "no-speech":
		case "no-transcript":
			return (
				customTranslations?.speech_recognition_no_speech ??
				"No speech was detected. Please try again."
			);

		// "network" is the engine's speech service being unreachable;
		// "language-not-supported" and "bad-grammar" are misconfiguration the
		// end user cannot act on (both are logged for the operator instead).
		default:
			return (
				customTranslations?.speech_recognition_error ??
				"Speech input is currently unavailable. Please type your message instead."
			);
	}
};
