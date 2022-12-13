import React from 'react';
import { styled } from '../../../../style';
import CloseIcon from "../../../../assets/baseline-close-24px.svg";
import IconButton from '../../../presentational/IconButton';
import LinearProgressBar from '../../../presentational/LinearProgressBar';
import { getFileExtension, getFileName } from './helper';

const UploadedFilesContainer = styled.div(({theme}) => ({
    paddingRight: theme.unitSize * 2,
    paddingLeft: theme.unitSize * 2,
    paddingBottom: theme.unitSize * 3 / 2,
    paddingTop: 0,
    display: 'flex',
    flexDirection: 'row',
    overflowX: 'auto',
    overflowY: 'hidden',
    alignItems: 'center',
}));

const FilePreviewWrapper = styled.div(({theme}) => ({
    marginRight: theme.unitSize,
    borderRadius: 4,
    maxWidth: 180,
    height: 34,
    border: '1px solid hsla(0, 0%, 0%, .1)',
}));

const UploadedFilePreview = styled.div(({theme}) => ({
    padding: theme.unitSize / 2,
    fontSize: 13,
    display: 'flex',
}));

const ImagePreview = styled.img(({theme}) => ({  
    borderRadius: 6,
    padding: theme.unitSize / 2,
    alignSelf: 'center',
}));

const FileNameTypography = styled.span(({theme}) => ({
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    color: 'hsla(0, 0%, 0%, .54)',
    alignSelf: 'center',
    paddingLeft: theme.unitSize / 2,
}));

const FileExtensionTypography = styled.span(() => ({
    color: 'hsla(0, 0%, 0%, .54)',
    alignSelf: 'center',
}));

const RemoveFileButton = styled(IconButton)(({ theme }) => ({
    padding: 4,
    paddingRight: 0,
    marginRight: 0,
    marginLeft: 'auto',
    "& svg" : {
        width: 18,
        height: 18,
    },
    "&:focus, &:hover": {
        fill: `${theme.primaryColor} !important`,
        outline: 'none',
    }
}));

interface IPreviewUploadedFilesProps {
    fileList: File[];
    onRemoveFileFromList: (index: number) => void;
}

class PreviewUploadedFiles extends React.PureComponent<React.HTMLProps<HTMLDivElement> & IPreviewUploadedFilesProps> {
    removeFileButtonRef: React.RefObject<HTMLButtonElement>;
   
    constructor(props) {
        super(props);
        this.removeFileButtonRef = React.createRef();
    }

    onRemoveFileButtonClick = (index: number) => {
        this.props.onRemoveFileFromList(index);
    }

    render() {
        const { fileList } = this.props;
        const progressPercentage = null; //TODO: Fix progress percentage after file upload backend is ready

        return (
            <UploadedFilesContainer>
                {fileList?.map((file, index) => (
                    <FilePreviewWrapper key={index}>
                        <UploadedFilePreview>
                            {file.type?.includes('image') && 
                                <ImagePreview width={20} height={20} src={URL.createObjectURL(file)}/>
                            }
                            <FileNameTypography>
                                {getFileName(file.name)}
                            </FileNameTypography>
                            <FileExtensionTypography>
                                {getFileExtension(file.name)}
                            </FileExtensionTypography>
                            <RemoveFileButton
                                onClick={() => this.onRemoveFileButtonClick(index)}
                                aria-label="Remove File Attacment"
                                ref={this.removeFileButtonRef}
                            >
                                <CloseIcon />
                            </RemoveFileButton>
                        </UploadedFilePreview>
                        {progressPercentage && progressPercentage !== 100 && 
                            <LinearProgressBar progressPercentage={progressPercentage} />
                        }
                  </FilePreviewWrapper>
                ))}
            </UploadedFilesContainer>
        );
    }
}

export default PreviewUploadedFiles;