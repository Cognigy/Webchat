import { Middleware } from "redux";
import { StoreState } from "../store";
import { IFile, setFileList, setFileUploadError } from "./input-reducer";
import { fetchFileUploadToken, uploadFile } from "../../helper/endpoint";
import { formatTemplate } from "@cognigy/chat-components";

const ADD_FILES_TO_LIST = "ADD_FILES_TO_LIST";
export const addFilesToList = (newFiles: File[]) => ({
	type: ADD_FILES_TO_LIST as "ADD_FILES_TO_LIST",
	newFiles,
});
type TAddFilesToListAction = ReturnType<typeof addFilesToList>;

type Actions = TAddFilesToListAction;

export const createFileInputMiddleware =
	(): Middleware<object, StoreState> => store => next => async (action: Actions) => {
		switch (action.type) {
			case "ADD_FILES_TO_LIST": {
				const {
					fileAttachmentMaxSize,
					embeddingConfiguration: { _endpointTokenUrl },
					customTranslations,
				} = store.getState().config.settings;

				const existingFileList = store.getState().input.fileList;
				let newFileList: IFile[] = [];
				const fileAttachmentMaxSizeInMb =
					fileAttachmentMaxSize > 0 ? fileAttachmentMaxSize / (1024 * 1024) : 0;

				// The reason is shown in the attachment chip and read out through
				// the status live region (FileUploadAnnouncer), so it is configurable
				// like every other user-facing string.
				const uploadFailedText = customTranslations?.file_upload_failed ?? "Upload Failed";
				const uploadInfectedText =
					customTranslations?.file_upload_infected ?? "Infected File";
				const uploadTooLargeText = formatTemplate(
					customTranslations?.file_upload_too_large ?? "File size > {maxSizeInMb}MB",
					{ maxSizeInMb: String(fileAttachmentMaxSizeInMb) },
				);
				action.newFiles?.forEach(file => {
					if (file.size > fileAttachmentMaxSize) {
						newFileList.push({
							file: file,
							progressPercentage: 10,
							hasUploadError: true,
							uploadErrorReason: uploadTooLargeText,
						});
					} else {
						newFileList.push({
							file: file,
							progressPercentage: 30,
						});
					}
				});

				store.dispatch(setFileList(existingFileList.concat(newFileList)));

				const fileUploadTokenApiUrl = `${_endpointTokenUrl}/fileuploadtoken`;
				let response;
				let hasError = false;
				try {
					response = await fetchFileUploadToken(fileUploadTokenApiUrl);
				} catch (err) {
					hasError = true;
				}

				newFileList = newFileList.map(fileItem => {
					if (!fileItem.hasUploadError) {
						fileItem.progressPercentage = 50;
						fileItem.hasUploadError = hasError;
						fileItem.uploadErrorReason = hasError
							? uploadFailedText
							: fileItem.uploadErrorReason;
					}
					return fileItem;
				});
				setTimeout(() => {
					store.dispatch(setFileList(existingFileList.concat(newFileList)));
				}, 100);

				newFileList = (
					await Promise.all(
						newFileList.map(async fileItem => {
							try {
								if (!fileItem.hasUploadError && !fileItem.isCancelled) {
									fileItem.abortController = new AbortController();
									fileItem.uploadFileMeta = await uploadFile(
										fileItem.file,
										response.fileUploadUrl,
										response.token,
										fileItem.abortController,
									);
									if (fileItem.uploadFileMeta.status === "infected") {
										fileItem.hasUploadError = true;
										fileItem.uploadErrorReason = uploadInfectedText;
										store.dispatch(setFileUploadError(true));
									}
									fileItem.uploadFileMeta.fileName = fileItem.file.name;
									fileItem.progressPercentage = 100;
								} else {
									store.dispatch(setFileUploadError(true));
								}
							} catch (err) {
								if (err.code === "ERR_CANCELED") {
									fileItem.isCancelled = true;
									return;
								} else {
									fileItem.hasUploadError = true;
									fileItem.uploadErrorReason = uploadFailedText;
									store.dispatch(setFileUploadError(true));
								}
							}
							return fileItem;
						}),
					)
				).filter(Boolean) as IFile[];
				store.dispatch(setFileList(existingFileList.concat(newFileList)));
				break;
			}
		}

		return next(action);
	};
