import { FC, useEffect } from "react";
import { useSelector } from "react-redux";
import { formatTemplate } from "@cognigy/chat-components";
import { StoreState } from "../../../webchat/store/store";
import { IFile } from "../../../webchat/store/input/input-reducer";
import { announceStatus } from "./StatusLiveRegion";

// Keyed by the File object, which stays the same across every snapshot the
// middleware dispatches, and disappears with the chip (removed or sent) — so
// nothing is announced twice and nothing is kept alive. Module-level like the
// StatusLiveRegion listeners: one widget instance per page.
const announcedFiles = new WeakSet<File>();

// An attachment has an outcome once it failed (any reason), was cancelled by
// removal, or finished uploading; 30/50 are the in-flight progress values.
const hasSettled = (item: IFile) =>
	Boolean(item.hasUploadError || item.isCancelled || item.progressPercentage === 100);

/**
 * Announces the outcome of file uploads through the status live region
 * (WCAG 4.1.3 Status Messages, techniques ARIA22 / ARIA19). Sighted users see
 * the attachment chip drop its progress bar, or turn red with the reason
 * ("Upload Failed", "File size > 10MB", …); neither reaches a screen reader,
 * and the failure additionally disables Send without saying why.
 *
 * Announced politely via <StatusLiveRegion> (role="status") — deliberately
 * not through role="alert": the user has just triggered the upload and is
 * waiting for its result, so a polite message is voiced promptly anyway, and
 * an assertive one may clear the queued announcement of an incoming chat
 * message (ARIA 1.2 lets assistive technology drop queued polite changes when
 * an assertive one arrives). This matches every other error in the widget
 * (connection and speech-recognition notifications), see docs/accessibility.md.
 *
 * One announcement per batch: when every attachment in the list has an
 * outcome, all not-yet-announced ones are read together, failures first
 * (file name + the reason shown in the chip), then the successes as one count.
 * A file rejected up front (too large) alone is therefore announced at once;
 * next to a sibling still uploading it waits for that sibling, so the two
 * outcomes arrive as one message instead of two updates racing each other
 * in the region.
 *
 * The middleware mutates the file items in place and re-dispatches snapshots
 * of the same array (+100ms and once the uploads settle), so the outcome is
 * derived from the items' fields on every store update rather than from the
 * array identity.
 */
const FileUploadAnnouncer: FC = () => {
	const fileList = useSelector((state: StoreState) => state.input.fileList);
	const ariaLabels = useSelector(
		(state: StoreState) => state.config.settings.customTranslations?.ariaLabels,
	);
	// Re-evaluated on every dispatch; a string, so unchanged outcomes never re-render.
	const outcomeSignature = useSelector((state: StoreState) =>
		state.input.fileList
			.map(
				item =>
					`${item.hasUploadError ? "e" : ""}${item.isCancelled ? "c" : ""}${
						item.progressPercentage ?? ""
					}`,
			)
			.join("|"),
	);

	useEffect(() => {
		if (!fileList.length || !fileList.every(hasSettled)) return;

		const pending = fileList.filter(
			item => !item.isCancelled && !announcedFiles.has(item.file),
		);
		if (!pending.length) return;
		pending.forEach(item => announcedFiles.add(item.file));

		const failed = pending.filter(item => item.hasUploadError);
		const uploaded = pending.filter(item => !item.hasUploadError);

		const segments = failed.map(item =>
			formatTemplate(ariaLabels?.fileAttachmentFailed ?? "{fileName}: {reason}", {
				fileName: item.file.name,
				reason: item.uploadErrorReason ?? "",
			}),
		);
		if (uploaded.length === 1) {
			segments.push(
				formatTemplate(ariaLabels?.fileAttachmentUploaded ?? "{fileName} attached", {
					fileName: uploaded[0].file.name,
				}),
			);
		} else if (uploaded.length > 1) {
			segments.push(
				formatTemplate(ariaLabels?.fileAttachmentsUploaded ?? "{count} files attached", {
					count: String(uploaded.length),
				}),
			);
		}

		announceStatus(segments.join(". "));
	}, [fileList, outcomeSignature, ariaLabels]);

	return null;
};

export default FileUploadAnnouncer;
