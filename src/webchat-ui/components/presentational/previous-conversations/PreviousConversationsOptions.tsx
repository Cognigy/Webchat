import styled from "@emotion/styled";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import React from "react";
import { Typography } from "@cognigy/chat-components";
import IconButton from "../IconButton";

const Container = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const OptionsContainer = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    padding: 0px 20px;
    flex-direction: column;
    overflow-y: auto;
`;

const DeleteButtonContainer = styled.div(() => ({
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
}));

const DeleteButton = styled(IconButton)(({ theme, selected }) => ({
    background: theme.red,
    display: "flex",
    padding: "12px 16px",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    borderRadius: 15,
    color: theme.white,
    "&: focus-visible": {
        outline: `2px solid ${theme.primaryColor}`,
        outlineOffset: 2,
    },
}));

const DividerWrapper = styled.div(() => ({
    padding: "12px 0px",
}));

const Divider = styled.div(({ theme }) => ({
    height: 1,
    width: "100%",
    backgroundColor: theme.black80,
}));

export interface PreviousConversationsOptionsProps {
    onShowPreviousConversationsOptionsScreen: (show: boolean) => void;
    onSetShowPrevConversations: (show: boolean) => void;
    config: IWebchatConfig;
}

export const PreviousConversationsOptions = (props: PreviousConversationsOptionsProps) => {
    const { onShowPreviousConversationsOptionsScreen, onSetShowPrevConversations, config } = props;

    const handleDeleteAllConversations = () => {
        // Implement the logic to delete all conversations
    };

    return (
        <>
            <Container>
                <OptionsContainer>
                    <Typography
                        variant="title1-semibold"
                        component="p"
                        className="webchat-rating-widget-title"
                    >
                        {config.settings.customTranslations?.delete_all_conversations ?? "Delete all conversations"}
                    </Typography>
                    <DeleteButtonContainer>
                        <DeleteButton onClick={handleDeleteAllConversations}>
                            {config.settings.customTranslations?.delete ?? "Delete"}
                        </DeleteButton>
                    </DeleteButtonContainer>
                </OptionsContainer>
                <DividerWrapper>
                    <Divider />
                </DividerWrapper>
            </Container>
        </>
    );
};