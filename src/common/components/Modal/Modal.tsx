import React from 'react';
import styled from '@emotion/styled';

const StyledDialog = styled.dialog`
    width: 50%;
    padding: 20px;
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    background-color: #fff;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
    margin: 0;
    font-size: 1.5em;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
`;

const ModalBody = styled.div`
    margin-bottom: 20px;
`;

const ModalFooter = styled.div`
    display: flex;
    justify-content: flex-end;
`;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <StyledDialog open={isOpen}>
            <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                <CloseButton onClick={onClose}>&times;</CloseButton>
            </ModalHeader>
            <ModalBody>{children}</ModalBody>
            <ModalFooter>
                <button onClick={onClose}>Close</button>
            </ModalFooter>
        </StyledDialog>
    );
};

export default Modal;