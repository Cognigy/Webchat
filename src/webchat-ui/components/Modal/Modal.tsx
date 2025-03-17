import React from 'react';
import styled from '@emotion/styled';
import IconButton from '../presentational/IconButton';
import CloseIcon from "../../assets/close-16px.svg";

const StyledDialog = styled.dialog`
    padding: 20px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    margin: 20px auto;
`;

const ModalHeader = styled.div`
    display: flex;
    align-items: center;
`;

const ModalTitle = styled.h2`
    margin: 0;
    font-size: 1.5em;
    margin-left:auto
`;

const CloseButton = styled(IconButton)(({ theme }) => ({
    color: theme.black10,
    borderRadius: 4,
    marginLeft: "auto",
    "&:focus-visible": {
        outline: `2px solid ${theme.primaryColor}`,
        outlineOffset: 2,
    },
    "& svg": {
        fill: theme.black10,
        width: 16,
        height: 16,
    },
    padding: 0,
}));

const ModalBody = styled.div`
    margin-bottom: 20px;
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: space-between;
`;

const DividerWrapper = styled.div(() => ({
    padding: "12px 0px",
    margin: "0px -20px"
}));

const Divider = styled.div(({ theme }) => ({
    height: 1,
    width: "100%",
    backgroundColor: theme.black80,
}));

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, footer, children }) => {
    return (
        <StyledDialog open={isOpen}>
            <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                <CloseButton onClick={onClose}>
                    <CloseIcon />
                </CloseButton>
            </ModalHeader>
            <DividerWrapper>
                <Divider />
            </DividerWrapper>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>
                {footer}
            </ModalFooter>
        </StyledDialog>
    );
};

export default Modal;