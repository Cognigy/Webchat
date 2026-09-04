import React from "react";
import styled from "@emotion/styled";
import classnames from "classnames";
import { InputComponentProps } from "../../../../../common/interfaces/input-plugin";
import SendIcon from "./send-icon-16px.svg";
import SpeechIconSVG from "./speech-icon-16px.svg";
import MenuIcon from "./baseline-menu-24px.svg";
import AttachFileIcon from "./attachment-icon-16px.svg";
import TextareaAutosize from "react-textarea-autosize";
import PreviewUploadedFiles from "../file/PreviewUploadedFiles";
import { IUploadFileMetaData } from "../../../../../common/interfaces/file-upload";
import { IFile } from "../../../../../webchat/store/input/input-reducer";
import MediaQuery from "react-responsive";
import PersistentMenu from "../menu/PersistentMenu";
import FloatingLabel from "./FloatingLabel";
import { IPersistentMenuItem } from "../../../../../common/interfaces/webchat-config";
import { createErrorNotification } from "../../../presentational/Notifications";
import {
	createSpeechRecognition,
	getSpeechRecognitionErrorMessage,
	FIRST_TRANSCRIPT_TIMEOUT_MS,
	TRANSCRIPT_IDLE_TIMEOUT_MS,
	SpeechRecognitionFailure,
} from "../../../../utils/speech-recognition";

const InputWrapper = styled.div({
	display: "flex",
	flexDirection: "column",
	gap: 12,
});

const InputForm = styled.form<{ persistentMenuOpen: boolean }>(({ persistentMenuOpen }) => ({
	display: "flex",
	alignItems: persistentMenuOpen ? "flex-end" : "center",
	gap: 12,
	marginBottom: 0,
}));

const TextArea = styled(TextareaAutosize)(({ theme }) => ({
	display: "block",
	flexGrow: 1,
	alignSelf: "stretch",
	padding: "8px 2px",

	border: "none",
	boxSizing: "border-box",
	outline: "none",
	resize: "none",
	backgroundColor: "transparent",
	overscrollBehavior: "contain",

	fontSize: "0.875rem", // 14px
	fontStyle: "normal",
	fontWeight: 400,
	lineHeight: "140%",

	"::-webkit-scrollbar": {
		width: 2,
		height: 2,
	},
	"::-webkit-scrollbar-track": {
		backgroundColor: theme.black95,
	},
	"::-webkit-scrollbar-thumb": {
		backgroundColor: theme.black60,
	},
}));

const Button = styled.button(({ theme }) => ({
	margin: 0,
	padding: 0,
	backgroundColor: "transparent",
	border: "none",
	borderRadius: 4,
	fill: theme.textDark,
	cursor: "pointer",
	outline: "none",

	"&[disabled]": {
		fill: theme.black60,
		cursor: "default",
	},
	"&:not(:disabled):hover": {
		fill: theme.primaryColorFocus,
	},
	"&:focus": {
		fill: theme.primaryColorFocus,
	},
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
	},
}));

const iconButtonStyles = {
	padding: "8px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	minWidth: "32px",
	minHeight: "32px",
};

const MenuButton = styled(Button)<{ open: boolean }>(({ theme, open }) => ({
	...iconButtonStyles,
	padding: "6px",
	fill: open ? theme.primaryColor : "initial",
}));

const AttachFileButton = styled(Button)(() => iconButtonStyles);

const SpeechButton = styled(Button)(({ theme }) => ({
	...iconButtonStyles,
	position: "relative",

	"&.webchat-input-button-speech-active": {
		fill: theme.textLight,
	},
}));

const SpeechIcon = styled(SpeechIconSVG)({
	position: "relative",
});

const SpeechButtonBackground = styled.div(({ theme }) => ({
	position: "absolute",
	backgroundColor: theme.primaryColor,
	height: 28,
	width: 28,
	borderRadius: 16,
}));

const SpeechButtonAnimatedBackground = styled.div(({ theme }) => ({
	position: "absolute",
	backgroundColor: theme.primaryColor,
	opacity: 0.2,
	height: 28,
	width: 28,
	borderRadius: 16,
	animation: `expanding 2s ease-in-out infinite`,

	"@keyframes expanding": {
		"from, to": {
			transform: "scale(1)",
		},
		"50%": {
			transform: "scale(1.3)",
		},
	},
}));

const HiddenFileInput = styled.input(() => ({
	display: "none",
}));

const SendMessageButton = styled(Button)(() => iconButtonStyles);

const InputContainer = styled.div({
	position: "relative",
	display: "flex",
	flexDirection: "column",
	flexGrow: 1,
});

const Label = styled(FloatingLabel)({
	padding: "8px 2px",
});

export interface TextInputState {
	text: string;
	selectionStart: number;
	selectionEnd: number;
}

interface ISpeechInputState {
	/** Transcript the engine has not finalized yet, appended after `text`. */
	speechResult: string;
}

interface IPersistentMenuState {
	isMenuOpen: boolean;
}

interface IBaseInputState extends TextInputState, ISpeechInputState, IPersistentMenuState {}

interface IBaseInputProps extends InputComponentProps {
	onChange: (value: string) => void;
	sttActive: boolean;
	onSetSTTActive: (active: boolean) => void;
	onSetTextActive: (active: boolean) => void;
	fileUploadError: boolean;
	fileList: IFile[];
	onSetFileList: (fileList: IFile[]) => void;
	onAddFilesToList: (fileList: File[]) => void;
}

declare global {
	interface Window {
		WebChatInputTextCallback: (text: string) => void;
	}
}

const combineStrings = (str1: string, str2: string) => {
	if (!str1) return str2;
	if (!str2) return str1;
	return str1 + " " + str2;
};

export class BaseInput extends React.PureComponent<IBaseInputProps, IBaseInputState> {
	constructor(props: IBaseInputProps) {
		super(props);

		this.state = {
			text: "",

			speechResult: "",
			isMenuOpen: false,
			selectionStart: 0,
			selectionEnd: 0,
		} as IBaseInputState;

		this.configureSpeechRecognition();
	}

	inputRef = React.createRef<HTMLTextAreaElement | HTMLInputElement>();
	menuRef = React.createRef<HTMLDivElement>();
	fileInputRef = React.createRef<HTMLInputElement>();

	/**
	 * The live recognizer, or null where the browser has no Web Speech API.
	 *
	 * Deliberately NOT component state: it is a mutable host object whose
	 * identity never changes, and keeping it in state invited
	 * `setState({ speechRecognition: { ...recognizer, lang } })` to apply the
	 * language. Native properties live on the prototype, so that spread
	 * copied nothing but `lang` — `start`, `stop` and every event handler
	 * disappeared, and the next click threw "start is not a function"
	 * (CGY-37417).
	 */
	private speechRecognition: SpeechRecognition | null = createSpeechRecognition();

	/** The warm-up or idle stop timer, whichever phase recognition is in. */
	private speechTimeout: ReturnType<typeof setTimeout> | null = null;

	/** Whether the engine has produced any transcript since `start()`. */
	private hasTranscript = false;

	/**
	 * Set while we are the ones ending recognition, so `onend` can tell an
	 * engine-initiated end (which has to reconcile the UI) from our own.
	 */
	private endingDeliberately = false;

	/**
	 * Set on the submit path, where a transcript arriving afterwards belongs
	 * to the message that was already sent. `abort()` should prevent one, but
	 * a result already dispatched can still be delivered, so the handler
	 * checks this too.
	 */
	private discardResults = false;

	/**
	 * A start() the engine rejected because a previous stop() had not reached
	 * `onend` yet. Retried once from `onend`, so a stop-then-start inside that
	 * window isn't silently dropped.
	 */
	private restartPending = false;

	componentDidMount(): void {
		// Global handler to modify the input text
		window.WebChatInputTextCallback = (text: string) => {
			this.setState({ text });
		};
		setTimeout(() => {
			if (!this.props.config.settings.widgetSettings.disableInputAutofocus) {
				this.inputRef.current?.focus?.();
			}
		}, 200);
	}

	componentDidUpdate() {
		this.applySTTLanguage();
	}

	componentWillUnmount(): void {
		this.clearSpeechTimeout();

		// The input unmounts on every screen change (back to the home screen,
		// into the previous-conversations list). Without releasing the engine
		// here the microphone stays open — browser recording indicator and
		// all — with nothing left to receive the transcript.
		if (this.speechRecognition) {
			this.endingDeliberately = true;
			this.speechRecognition.onresult = null;
			this.speechRecognition.onerror = null;
			this.speechRecognition.onend = null;

			try {
				// abort(), not stop(): a final transcript can no longer be
				// delivered anywhere, so don't wait for one.
				this.speechRecognition.abort();
			} catch {
				// Never started, or already finished.
			}
		}

		// `sttActive` lives in the store, which outlives this component —
		// leaving it set would show an active mic button on the next visit to
		// the chat screen with nothing actually listening.
		if (this.props.sttActive) this.props.onSetSTTActive(false);
	}

	private configureSpeechRecognition() {
		const recognition = this.speechRecognition;
		if (!recognition) return;

		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.onresult = this.handleSpeechResult;
		recognition.onerror = this.handleSpeechError;
		recognition.onend = this.handleSpeechEnd;

		this.applySTTLanguage();
	}

	/**
	 * Applies the configured STT language to the live recognizer.
	 *
	 * Runs on every update because the endpoint config is fetched
	 * asynchronously, so `STTLanguage` is typically absent when this
	 * component first mounts. While it is unset we leave the engine's own
	 * default (which follows the page's `lang`) rather than forcing a locale,
	 * so an unconfigured German page keeps transcribing German.
	 */
	private applySTTLanguage() {
		const sttLanguage = this.props.config.settings.widgetSettings.STTLanguage;

		if (this.speechRecognition && sttLanguage && this.speechRecognition.lang !== sttLanguage) {
			this.speechRecognition.lang = sttLanguage;
		}
	}

	private clearSpeechTimeout() {
		if (this.speechTimeout) {
			clearTimeout(this.speechTimeout);
			this.speechTimeout = null;
		}
	}

	/**
	 * Arms the single stop timer. `delay` is the warm-up budget before the
	 * first transcript and the idle budget after it — the two differ by an
	 * order of magnitude, see the constants' rationale.
	 */
	private armSpeechTimeout(delay: number) {
		this.clearSpeechTimeout();

		this.speechTimeout = setTimeout(() => {
			this.speechTimeout = null;
			const recognizedNothing = !this.hasTranscript;

			// A dictation that produced text ended normally, and the user's
			// next move is to edit or send it, so focus goes to the input.
			// Having heard nothing is a failure like any other: leave focus
			// wherever the user put it (SC 3.2.1).
			this.endSpeech({ restoreFocus: !recognizedNothing });

			// The whole warm-up budget spent without a single word: the
			// engine never reached its speech service, or the user never
			// spoke. Either way, say so — this path used to stop the
			// microphone silently (CGY-37417).
			if (recognizedNothing) this.notifySpeechFailure("no-transcript");
		}, delay);
	}

	private notifySpeechFailure(failure: SpeechRecognitionFailure) {
		createErrorNotification(
			getSpeechRecognitionErrorMessage(
				failure,
				this.props.config.settings.customTranslations,
			),
		);
	}

	handleSpeechResult = (e: SpeechRecognitionEvent) => {
		// A result that raced the abort() on the submit path. The message it
		// belongs to has already been sent and `text` cleared, so committing
		// it would refill the input with what the user just sent — and their
		// next Enter would send it a second time.
		if (this.discardResults) return;

		const result = e.results[e.resultIndex];
		const { transcript } = result[0];

		// Edge emits placeholder results — `isFinal` with an empty transcript
		// — when speech starts and again on stop(); Chrome never does.
		// Committing one would wipe the interim transcript on screen, and
		// counting one as "the engine is producing output" would start the
		// short idle countdown seconds before the first real word arrives.
		if (!transcript) return;

		this.hasTranscript = true;

		// Only while listening: stop() lets one last result land afterwards,
		// and re-arming then would stop recognition and steal focus back to
		// the input seconds after the user had moved on.
		if (this.props.sttActive) this.armSpeechTimeout(TRANSCRIPT_IDLE_TIMEOUT_MS);

		// Interim results are shown next to the typed text but not committed;
		// only a final result becomes part of the message.
		if (result.isFinal) {
			this.setState(({ text }) => ({
				speechResult: "",
				text: combineStrings(text, transcript),
			}));
			return;
		}

		this.setState({ speechResult: transcript });
	};

	handleSpeechError = (event: SpeechRecognitionErrorEvent) => {
		// `aborted` is just the engine acknowledging our own stop()/abort().
		if (event.error === "aborted") return;

		if (event.error === "language-not-supported" || event.error === "bad-grammar") {
			// Misconfiguration the end user cannot act on: they get the
			// generic message, the operator gets the detail.
			console.warn(
				`[cognigy-webchat] speech recognition rejected the configured STT language "${this.speechRecognition?.lang}" (${event.error})`,
			);
		}

		// A failure is not a user-initiated stop: leave focus alone. The
		// button's `aria-pressed` change and the notification convey it.
		this.endSpeech({ restoreFocus: false });
		this.notifySpeechFailure(event.error);
	};

	handleSpeechEnd = () => {
		const wasDeliberate = this.endingDeliberately;
		this.endingDeliberately = false;

		// The user pressed the button again while the engine was still
		// winding down from the previous stop, so `start()` was rejected.
		// Honour it now that the engine has actually ended — once, because
		// only a rejected start sets the flag.
		if (this.restartPending) {
			this.restartPending = false;
			this.startSpeech();
			return;
		}

		if (wasDeliberate) return;

		// The engine ended on its own — its service dropped the connection,
		// or it decided the utterance was over despite `continuous`.
		// Reconcile, so the button can never claim to be listening when
		// nothing is (SC 4.1.2).
		if (this.props.sttActive) this.endSpeech({ restoreFocus: false });
	};

	/** The user pressed the microphone button to stop dictating. */
	handleCancelSpeech = () => {
		this.endSpeech({ restoreFocus: true });
	};

	/**
	 * Ends recognition and reconciles the UI.
	 *
	 * `discardPending` is for the submit path only: the message has been sent
	 * and `text` cleared, so a transcript arriving afterwards has to be
	 * thrown away rather than committed. Everywhere else a late final is
	 * welcome — it is the engine's better-punctuated version of the interim
	 * that was on screen, and dropping it would lose the user's words.
	 *
	 * `restoreFocus` is true only when the user themselves stopped: they are
	 * likely to carry on typing. On an error or a timeout the stop was not
	 * requested, and moving focus then would take it from wherever the user
	 * had put it (SC 3.2.1).
	 */
	private endSpeech({
		discardPending = false,
		restoreFocus,
	}: {
		discardPending?: boolean;
		restoreFocus: boolean;
	}) {
		this.clearSpeechTimeout();
		this.endingDeliberately = true;
		this.discardResults = discardPending;

		try {
			if (discardPending) {
				// abort() asks the engine not to return a result at all,
				// unlike stop(), which finalizes what it heard.
				this.speechRecognition?.abort();
			} else {
				this.speechRecognition?.stop();
			}
		} catch {
			// Not currently running.
		}

		this.props.onSetSTTActive(false);

		this.setState({ speechResult: "" });

		if (restoreFocus && this.inputRef.current) {
			this.inputRef.current.focus();
		}
	}

	isSTTSupported() {
		return !!this.speechRecognition;
	}

	toggleSTT = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();

		if (this.props.sttActive) {
			this.handleCancelSpeech();
			return;
		}

		this.startSpeech();
	};

	private startSpeech() {
		const recognition = this.speechRecognition;
		if (!recognition) return;

		this.hasTranscript = false;
		this.endingDeliberately = false;
		this.discardResults = false;

		try {
			recognition.start();
		} catch (error) {
			if ((error as DOMException)?.name === "InvalidStateError") {
				// The engine is still winding down from a previous stop()
				// whose `onend` hasn't arrived. Claiming to listen here would
				// leave the button on with nothing running, so wait for the
				// end and start then.
				this.restartPending = true;
				return;
			}

			// The engine never started listening, so the button must not
			// claim that it did.
			this.notifySpeechFailure("start-failed");
			return;
		}

		this.armSpeechTimeout(FIRST_TRANSCRIPT_TIMEOUT_MS);
		this.props.onSetSTTActive(true);
	}

	handleChangeTextValue = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
		this.setState({
			text: e.target.value,
		});
		this.props.onChange(e.target.value);
	};

	handleSubmit: React.FormEventHandler = e => {
		e.preventDefault();
		e.stopPropagation();

		const { text, speechResult } = this.state;
		const { sttActive, fileList } = this.props;

		let messageText = text;

		if (sttActive) {
			// Send exactly what the field shows. The old condition required
			// BOTH parts, so submitting a message that was purely dictated
			// (no typed text yet) sent an empty string.
			messageText = combineStrings(text, speechResult);

			// Discard whatever the engine still owes us: it belongs to this
			// message, which is on its way. handleSubmit restores focus to
			// the input itself once the message is sent.
			this.endSpeech({ discardPending: true, restoreFocus: false });
		}

		// `messageText`, not `text`: a dictation the user never typed a word of
		// must still submit.
		if (!messageText && !fileList) return;

		const attachments: IUploadFileMetaData[] = [];
		fileList.forEach(fileItem => {
			if (fileItem.uploadFileMeta) {
				if (!fileItem.hasUploadError) {
					attachments.push(fileItem.uploadFileMeta);
				}
			}
		});

		let data: any = null;
		if (attachments.length > 0) {
			data = { attachments };
		}

		this.props.onSetFileList([]);
		this.setState(
			{
				text: "",
			},
			() => {
				this.props.onSendMessage(messageText, data, {
					collate: true,
				});

				if (this.inputRef.current) this.inputRef.current.focus();
			},
		);
	};

	/**
	 * overrides the default textarea "return" key behavior.
	 *
	 * Return should "submit"
	 * Shift+Return should insert a "newline" (default)
	 */
	handleInputKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
		if (event.key === "Enter" && !event.shiftKey && !event?.nativeEvent?.isComposing) {
			event.preventDefault();
			event.stopPropagation();

			// submit
			this.handleSubmit(event);
		}
	};

	handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		const newFilesArray = Array.prototype.slice.call(files);
		this.props.onAddFilesToList(newFilesArray);
		event.target.value = "";
	};

	handleUploadFile = event => {
		event.preventDefault();
		this.fileInputRef.current?.click();
	};

	handleFocus = () => {
		setTimeout(() => {
			this.props.onSetTextActive(true);
		}, 200);
	};

	handleBlur: React.FocusEventHandler<HTMLTextAreaElement> = e => {
		setTimeout(() => {
			this.props.onSetTextActive(false);
		}, 200);
		this.setState({
			selectionStart: e.target.selectionStart,
			selectionEnd: e.target.selectionEnd,
		});
	};

	togglePeristentMenu = () => {
		this.setState(
			prevState => ({
				isMenuOpen: !prevState.isMenuOpen,
			}),
			() => {
				if (!this.state.isMenuOpen) {
					if (this.inputRef.current) {
						this.inputRef.current?.setSelectionRange(
							this.state.selectionStart,
							this.state.selectionEnd,
						);
						this.inputRef.current.focus();
					}
				}
			},
		);
	};

	onSelectPersistentMenuItem = (item: IPersistentMenuItem) => {
		this.togglePeristentMenu();
		this.props.onSendMessage(item.payload, null, {
			label: item.title,
		});
	};

	render() {
		const { props, state } = this;

		const { sttActive, fileUploadError, fileList } = props;

		const { text, speechResult: speechInterim, isMenuOpen } = state;

		const { layout, fileStorageSettings, widgetSettings, customTranslations } =
			props.config.settings;

		const {
			disableInputAutocomplete,
			inputAutogrowMaxRows,
			enablePersistentMenu,
			persistentMenu,
		} = layout;
		const showPersistentMenu = enablePersistentMenu && persistentMenu?.menuItems.length > 0;
		const { disableInputAutofocus } = widgetSettings;

		const isFileAttachmentEnabled = fileStorageSettings?.enabled;

		const isFileListEmpty = fileList?.length === 0;

		return (
			<>
				<InputWrapper>
					<InputForm
						onSubmit={this.handleSubmit}
						className={classnames("webchat-input-menu-form")}
						persistentMenuOpen={isMenuOpen}
					>
						{showPersistentMenu && (
							<MenuButton
								onClick={this.togglePeristentMenu}
								aria-label={
									customTranslations?.ariaLabels?.togglePersistentMenu ??
									"Toggle chat input menu"
								}
								aria-expanded={isMenuOpen}
								className="webchat-input-persistent-menu-button"
								id="webchatInputButtonMenu"
								open={isMenuOpen}
								type="button"
							>
								<MenuIcon />
							</MenuButton>
						)}
						{isMenuOpen && showPersistentMenu ? (
							<PersistentMenu
								title={persistentMenu.title}
								menuItems={persistentMenu.menuItems}
								onSelect={this.onSelectPersistentMenuItem}
							/>
						) : (
							<>
								{isFileAttachmentEnabled && (
									<>
										<HiddenFileInput
											ref={this.fileInputRef}
											type="file"
											multiple
											onChange={this.handleSelectFile}
											aria-hidden="true"
										/>
										<AttachFileButton
											className="webchat-input-button-add-attachments"
											onClick={this.handleUploadFile}
											aria-label={
												customTranslations?.ariaLabels?.addAttachment ??
												"Add attachments"
											}
											id="webchatInputMessageAttachFileButton"
										>
											<AttachFileIcon />
										</AttachFileButton>
									</>
								)}
								<MediaQuery maxWidth={575}>
									{matches => {
										const hasValue = !!combineStrings(text, speechInterim);
										return (
											<InputContainer className="webchat-input-message-container">
												<Label
													inputId="webchatInputMessageInputInTextMode"
													isVisible={!hasValue}
													label={
														props.config.settings.behavior
															.inputPlaceholder
													}
													className="webchat-input-message-label"
												/>
												<TextArea
													ref={
														this
															.inputRef as React.Ref<HTMLTextAreaElement>
													}
													// Intentional: focus the message input so keyboard
													// users can type right away. Opt-out is exposed via
													// the `disableInputAutofocus` setting.
													// eslint-disable-next-line jsx-a11y/no-autofocus
													autoFocus={!disableInputAutofocus}
													value={combineStrings(text, speechInterim)}
													onChange={this.handleChangeTextValue}
													onFocus={this.handleFocus}
													onBlur={this.handleBlur}
													onKeyDown={this.handleInputKeyDown}
													className="webchat-input-message-input"
													minRows={1}
													maxRows={inputAutogrowMaxRows}
													autoComplete={
														disableInputAutocomplete ? "off" : undefined
													}
													enterKeyHint="send"
													spellCheck={false}
													id="webchatInputMessageInputInTextMode"
													style={
														matches ? { fontSize: "1rem" } : undefined
													}
												/>
											</InputContainer>
										);
									}}
								</MediaQuery>

								{props.config.settings.behavior.enableSTT && (
									<SpeechButton
										type="button"
										className={classnames(
											"webchat-input-button-speech",
											sttActive && "webchat-input-button-speech-active",
										)}
										aria-label={
											customTranslations?.ariaLabels?.speechToText ??
											"Speech to text"
										}
										// APG toggle button: the "listening"
										// state is otherwise conveyed only by
										// the animated background, which is
										// aria-hidden (SC 4.1.2).
										aria-pressed={sttActive}
										id="webchatInputMessageSpeechButton"
										onClick={this.toggleSTT}
										disabled={!this.isSTTSupported()}
									>
										{sttActive && (
											<>
												<SpeechButtonAnimatedBackground
													className={classnames(
														"webchat-input-button-speech-background",
													)}
													aria-hidden="true"
												/>
												<SpeechButtonBackground
													className={classnames(
														"webchat-input-button-speech-background",
													)}
													aria-hidden="true"
												/>
											</>
										)}
										<SpeechIcon />
									</SpeechButton>
								)}

								<SendMessageButton
									disabled={
										(this.state.text === "" && isFileListEmpty) ||
										fileUploadError
									}
									className="webchat-input-button-send cc-rtl-flip"
									aria-label={
										customTranslations?.ariaLabels?.sendMessage ??
										"Send message"
									}
									id="webchatInputMessageSendMessageButton"
								>
									<SendIcon />
								</SendMessageButton>
							</>
						)}
					</InputForm>
					{!isFileListEmpty && <PreviewUploadedFiles />}
				</InputWrapper>
			</>
		);
	}
}
