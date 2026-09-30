import React, { FC, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import CloseIcon from "../../../../assets/close-10px.svg";
import IconButton from "../../../presentational/IconButton";
import { getContrastColor } from "../../../../style";
import LinearProgressBar from "../../../presentational/LinearProgressBar";
import { announceStatus } from "../../../presentational/StatusLiveRegion";
import { getFileExtension, getFileName } from "./helper";
import { Typography, formatTemplate } from "@cognigy/chat-components";
import { useDispatch, useSelector } from "react-redux";
import { StoreState } from "../../../../../webchat/store/store";
import { IFile, removeFileFromList } from "../../../../../webchat/store/input/input-reducer";

const CHIP_HEIGHT = 33;
const CHIP_GAP = 12;
const MAX_VISIBLE_ROWS = 3;

// Chips wrap onto further rows instead of scrolling horizontally, so every
// attachment stays readable at a glance. Past three rows the area scrolls
// vertically, with the same scrollbar styling as the message textarea
// (BaseInput.tsx) so both get restyled together.
const UploadedFilesContainer = styled.div(({ theme }) => ({
	display: "flex",
	flexDirection: "row",
	flexWrap: "wrap",
	alignItems: "center",
	gap: CHIP_GAP,
	maxHeight: MAX_VISIBLE_ROWS * CHIP_HEIGHT + (MAX_VISIBLE_ROWS - 1) * CHIP_GAP,
	overflowY: "auto",

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

const FilePreviewWrapper = styled.div(({ theme }) => ({
	position: "relative",
	// Clips the progress bar's corners. Note a flex item with overflow:hidden
	// may shrink to 0 — the wrapping row above never asks it to, and maxWidth
	// caps long names to the FileName ellipsis instead of one huge chip.
	overflow: "hidden",
	maxWidth: 200,
	borderRadius: 15,
	height: CHIP_HEIGHT,
	// A lone chip wider than its line could still shrink (and collapse its
	// name) — never shrink; maxWidth above keeps it fitting instead.
	flexShrink: 0,
	backgroundColor: theme.black95,
}));

const UploadedFilePreview = styled.div(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: 12,
	padding: "0 12px 0 6px",
	height: "100%",
}));

const FileName = styled(Typography)<Pick<IFile, "hasUploadError">>(({ hasUploadError, theme }) => ({
	whiteSpace: "nowrap",
	textOverflow: "ellipsis",
	overflow: "hidden",
	color: hasUploadError ? theme.red40 : theme.black10,
	alignSelf: "center",
}));

const FileSize = styled(Typography)(({ theme }) => ({
	color: theme.black40,
	alignSelf: "center",
	textWrap: "nowrap",
}));

// Keyboard focus is shown on the button itself as two rings (same construction
// as the launcher's FAB): an outer ring in the primary's focus variant and an
// inner ring in that colour's computed contrast colour — white on a dark
// primary, black on a light one. The two rings always contrast with each
// other, so at least one of them contrasts with the chip whatever primary the
// customer configures (SC 1.4.11 / 2.4.7). The chip background stays
// untouched, so its texts keep their idle contrast (black40 / red40 on black95).
const RemoveFileButton = styled(IconButton)(({ theme }) => ({
	padding: 0,
	marginRight: -6,
	borderRadius: "50%",
	"& svg": {
		width: 12,
		height: 12,
	},
	"&:hover": {
		"& path": {
			fill: `${theme.primaryColor} !important`,
		},
	},
	"&:focus-visible": {
		outline: `2px solid ${theme.primaryColorFocus}`,
		outlineOffset: 2,
		boxShadow: `0 0 0 2px ${getContrastColor(theme.primaryColorFocus, theme)}`,
	},
}));

const PreviewUploadedFiles: FC = () => {
	const fileList = useSelector((state: StoreState) => state.input.fileList);
	const ariaLabels = useSelector(
		(state: StoreState) => state.config.settings.customTranslations?.ariaLabels,
	);

	const dispatch = useDispatch();

	// Removing a chip unmounts its (focused) remove button, which would drop
	// keyboard focus to <body> (SC 2.4.3). Focus moves to the remove button of
	// the neighbouring chip instead — the one that takes the removed chip's
	// position, or the previous one when the last chip was removed — and to the
	// attach button once the list is empty, where a user would add the next
	// file (persistent-menu toggle / message input when that is not rendered).
	// Only when the removed button actually held focus, so a removal
	// triggered while focus is elsewhere does not yank it.
	const pendingFocusIndexRef = useRef<number | null>(null);

	const onRemoveFileButtonClick = (index: number, event: React.MouseEvent<HTMLButtonElement>) => {
		const removed = fileList[index];
		if (document.activeElement === event.currentTarget) {
			const remaining = fileList.length - 1;
			if (remaining > 0) {
				pendingFocusIndexRef.current = Math.min(index, remaining - 1);
			} else {
				// This component unmounts with the last chip, so its effect can't
				// run any more — focus the successor now. The attach button is
				// replaced by the persistent menu while that menu is open (its
				// toggle stays), and the message input is the last resort.
				const successor =
					document.getElementById("webchatInputMessageAttachFileButton") ??
					document.getElementById("webchatInputButtonMenu") ??
					document.getElementById("webchatInputMessageInputInTextMode");
				successor?.focus();
			}
		}
		dispatch(removeFileFromList(index));
		// The chip disappearing is the only visible feedback; say so (SC 4.1.3).
		if (removed) {
			announceStatus(
				formatTemplate(ariaLabels?.fileAttachmentRemoved ?? "{fileName} removed", {
					fileName: removed.file.name,
				}),
			);
		}
	};

	useEffect(() => {
		const index = pendingFocusIndexRef.current;
		if (index === null) return;
		pendingFocusIndexRef.current = null;
		document.querySelector<HTMLButtonElement>(`#filePreview${index} button`)?.focus();
	}, [fileList]);

	return (
		<UploadedFilesContainer>
			{fileList?.map((item, index) => (
				<FilePreviewWrapper key={index} id={`filePreview${index}`}>
					<UploadedFilePreview>
						<RemoveFileButton
							type="button"
							onClick={event => onRemoveFileButtonClick(index, event)}
							// Position + file name: the chip's own text is not part of the
							// button's name, and a failed chip shows the reason, not the name.
							aria-label={`${ariaLabels?.removeFileAttachment ?? "Remove file attachment"} ${index + 1}, ${item.file.name}`}
						>
							<CloseIcon />
						</RemoveFileButton>
						<FileName
							component="span"
							variant="title2-regular"
							hasUploadError={item.hasUploadError}
						>
							{!item.hasUploadError
								? `${getFileName(item.file.name)}${getFileExtension(
										item.file.name,
									)}`
								: item.uploadErrorReason}
						</FileName>
						<FileSize component="span" variant="title2-regular">
							{item.file.size > 1000000
								? `${(item.file.size / 1000000).toFixed(2)} MB`
								: `${(item.file.size / 1000).toFixed(2)} KB`}
						</FileSize>
					</UploadedFilePreview>
					{item.progressPercentage &&
						item.progressPercentage !== 100 &&
						!item.hasUploadError && (
							<LinearProgressBar progressPercentage={item.progressPercentage} />
						)}
				</FilePreviewWrapper>
			))}
		</UploadedFilesContainer>
	);
};

export default PreviewUploadedFiles;
