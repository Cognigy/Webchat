import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";

import { BaseInput } from "./BaseInput";
import { StoreState } from "../../../../../webchat/store/store";
import { InputComponentProps } from "../../../../../common/interfaces/input-plugin";
import {
	IFile,
	setFileList,
	setSTTActive,
	setTextActive,
} from "../../../../../webchat/store/input/input-reducer";
import { addFilesToList } from "../../../../../webchat/store/input/file-input-middleware";
import { inputContentUpdated } from "../../../../../webchat/store/typing/actions";
import { throttle } from "lodash";

export const ConnectedBaseInput = (props: InputComponentProps) => {
	const sttActive = useSelector((state: StoreState) => state.input.sttActive);
	const fileList = useSelector((state: StoreState) => state.input.fileList);
	const fileUploadError = useSelector((state: StoreState) => state.input.fileUploadError);

	const dispatch = useDispatch();

	const throttledInputContentUpdated = useCallback(
		throttle(() => {
			dispatch(inputContentUpdated());
		}, 1000),
		[],
	);

	return (
		<BaseInput
			{...props}
			sttActive={sttActive}
			onSetSTTActive={(active: boolean) => dispatch(setSTTActive(active))}
			onSetTextActive={(active: boolean) => dispatch(setTextActive(active))}
			onChange={throttledInputContentUpdated}
			fileList={fileList}
			fileUploadError={fileUploadError}
			onSetFileList={(fileList: IFile[]) => dispatch(setFileList(fileList))}
			onAddFilesToList={(fileList: File[]) => dispatch(addFilesToList(fileList))}
		/>
	);
};
