import React from "react";
import styled from "@emotion/styled";
import type { IWebchatConfig } from "../../../common/interfaces/webchat-config";
import classNames from "classnames";

import ChatIconSvg from "../../assets/baseline-chat-24px.svg";
import ChatBubbleOutline1 from "../../assets/chat-bubble-outline-1.svg";
import ChatBubbleOutline2 from "../../assets/chat-bubble-outline-2.svg";
import ChatBubbleOutline3 from "../../assets/chat-bubble-outline-3.svg";

const ChatIconMask = styled.span<{ src: string }>(({ theme, src }) => {
	const urlValue = `url("${String(src).replace(/\"/g, '\\"')}")`;
	return {
		display: "inline-block",
		width: 20,
		height: 20,
		backgroundColor: theme.primaryContrastColor,
		WebkitMaskImage: urlValue,
		maskImage: urlValue,
		WebkitMaskRepeat: "no-repeat",
		maskRepeat: "no-repeat",
		WebkitMaskPosition: "center",
		maskPosition: "center",
		WebkitMaskSize: "contain",
		maskSize: "contain",
	};
});

export interface ChatIconProps {
	config: IWebchatConfig;
}

const ChatIcon: React.FC<ChatIconProps> = ({ config }) => {
	const iconRef = config.settings?.layout?.iconUrl ?? "default-1";
	const animationClass = config.settings?.layout?.iconAnimation || "";
	const burstDuration = `${Math.max(
		0.2,
		1 / Math.max(0.1, config.settings?.layout?.iconAnimationSpeed || 1),
	)}s`;
    const burstDurationStyle = { "--icon-burst-duration": burstDuration } as React.CSSProperties;
    
	// Use built-in defaults if string is like "default-1"
	if (typeof iconRef === "string" && iconRef.startsWith("default-")) {
		const index = Math.max(0, Number(iconRef.replace("default-", "")) - 1);
		const defaultIcons = [ChatBubbleOutline1, ChatBubbleOutline2, ChatBubbleOutline3];
		const DefaultIcon = (defaultIcons[index] ?? ChatIconSvg) as React.ComponentType<{
			className?: string;
			"aria-hidden"?: boolean;
			style?: React.CSSProperties;
		}>;
		return (
			<DefaultIcon
				className={classNames("iconAnimationContainer", animationClass)}
				aria-hidden
				style={burstDurationStyle}
			/>
		);
	}

	// SVG by data URI or file extension -> mask to current color
	const isSvgDataUri = /^data:image\/(svg\+xml|svg)/i.test(String(iconRef));
	const isSvgFile = String(iconRef).trim().toLowerCase().endsWith(".svg");
	if (isSvgDataUri || isSvgFile) {
		return (
			<ChatIconMask
				src={String(iconRef)}
				aria-hidden
				className={classNames("iconAnimationContainer", animationClass)}
				style={burstDurationStyle}
			/>
		);
	}

	// PNG data URI or file -> render as <img>
	const isPngDataUri = /^data:image\/png/i.test(String(iconRef));
	const isPngFile = String(iconRef).trim().toLowerCase().endsWith(".png");
	if (isPngDataUri || isPngFile) {
		return (
			<img
				src={String(iconRef)}
				alt=""
				aria-hidden
				className={classNames("iconAnimationContainer", animationClass)}
				style={
					{
						width: 20,
						height: 20,
						display: "inline-block",
						...burstDurationStyle,
					}
				}
			/>
		);
	}

	// Fallback
	return (
		<ChatIconSvg
			aria-hidden
			className={classNames("iconAnimationContainer", animationClass)}
			style={burstDurationStyle}
		/>
	);
};

export default ChatIcon;
