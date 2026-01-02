import React from "react";
import styled from "@emotion/styled";
import { useSelector, useDispatch } from "react-redux";
import { StoreState } from "../../../../webchat/store/store";
import { setTTSActive } from "../../../../webchat/store/ui/ui-reducer";
import { IWebchatConfig } from "../../../../common/interfaces/webchat-config";
import { RatingWidget } from "./RatingWidget";
import { PostbackButtons } from "./PostbackButtons";
import { WebchatUIProps } from "../../WebchatUI";
import { ChatOptionsFooter } from "./ChatOptionsFooter";
import TTSOption from "./TTSOption";
import DeleteConversation from "./DeleteConversation";

const ChatOptionsRoot = styled.div({
	width: "100%",
	height: "100%",
	display: "flex",
	flexDirection: "column",
});

const ChatOptionsContainer = styled.div({
	width: "100%",
	height: "100%",
	display: "flex",
	padding: "0 20px",
	flexDirection: "column",
	overflowY: "auto",
});

const DividerWrapper = styled.div({
	padding: "12px 0px",
});

const Divider = styled.div(({ theme }) => ({
	height: 1,
	width: "100%",
	backgroundColor: theme.black80,
}));

export interface IOnSendRatingProps {
	rating: number | null;
	comment: string;
	showRatingStatus: boolean;
}

interface IChatOptionsProps {
	config: IWebchatConfig;
	ratingTitleText: string;
	ratingCommentText: string;
	ratingSubmitButtonText: string;
	ratingEventBannerText: string;
	showOnlyRating: boolean;
	hasGivenRating: boolean;
	onSendRating: (props: IOnSendRatingProps) => void;
	onEmitAnalytics: WebchatUIProps["onEmitAnalytics"];
	onSendActionButtonMessage: WebchatUIProps["onSendMessage"];
	onDeleteModalStateChange: (open: boolean) => void;
}

/**
 * This component renders both the Chat Options screen and the Rating screen.
 * On the rating screen (opened as a result of a request rating node), only the rating widget is displayed.
 */
export const ChatOptions = (props: IChatOptionsProps) => {
	const {
		config,
		showOnlyRating,
		ratingTitleText,
		ratingCommentText,
		ratingSubmitButtonText,
		ratingEventBannerText,
		hasGivenRating,
		onSendRating,
		onEmitAnalytics,
		onSendActionButtonMessage,
		onDeleteModalStateChange,
	} = props;
	const { settings } = config;
	const { chatOptions } = settings;

	const ratingEnabled = chatOptions.rating.enabled;
	const showRating =
		ratingEnabled === "always" ||
		(ratingEnabled === "once" && !hasGivenRating) ||
		showOnlyRating;

	const ttsEnabled = useSelector((state: StoreState) => state.ui.ttsActive);
	const dispatch = useDispatch();

	const handleToggleTTS = () => {
		dispatch(setTTSActive(!ttsEnabled));
	};

	const showDeleteConversation = !!chatOptions.enableDeleteConversation;
	return (
		<ChatOptionsRoot className="webchat-chat-options-root">
			<ChatOptionsContainer className="webchat-chat-options-container">
				{showOnlyRating ? (
					// Rating Screen
					<RatingWidget
						ratingTitleText={ratingTitleText}
						ratingCommentText={ratingCommentText}
						onSendRating={onSendRating}
						showRatingStatus={showOnlyRating}
						ratingEventBannerText={ratingEventBannerText}
						buttonText={ratingSubmitButtonText}
					/>
				) : (
					// Chat Options Screen
					<>
						{config.settings.chatOptions.quickReplyOptions.enabled && (
							<>
								<PostbackButtons
									config={config}
									onSendActionButtonMessage={onSendActionButtonMessage}
									onEmitAnalytics={onEmitAnalytics}
								/>
								<DividerWrapper>
									<Divider />
								</DividerWrapper>
							</>
						)}
						{config.settings.chatOptions.showTTSToggle && (
							<>
								<TTSOption onToggle={handleToggleTTS} config={config} />
								<DividerWrapper>
									<Divider />
								</DividerWrapper>
							</>
						)}
						{showRating && (
							<>
								<RatingWidget
									ratingTitleText={ratingTitleText}
									ratingCommentText={ratingCommentText}
									onSendRating={onSendRating}
									showRatingStatus={showOnlyRating}
									ratingEventBannerText={ratingEventBannerText}
									buttonText={ratingSubmitButtonText}
								/>
								<DividerWrapper>
									<Divider />
								</DividerWrapper>
							</>
						)}
						{showDeleteConversation && (
							<DeleteConversation
								onDeleteModalStateChange={onDeleteModalStateChange}
								config={config}
							/>
						)}
					</>
				)}
			</ChatOptionsContainer>
			{chatOptions.footer.enabled && chatOptions.footer.items[0] && (
				<ChatOptionsFooter settings={config.settings} />
			)}
		</ChatOptionsRoot>
	);
};
