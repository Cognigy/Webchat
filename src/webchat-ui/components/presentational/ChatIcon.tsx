import React from "react";
import styled from "@emotion/styled";
import type { IWebchatConfig } from "../../../common/interfaces/webchat-config";

// Default/fallback chat icon asset
import ChatIconSvg from "../../assets/baseline-chat-24px.svg";

// Optional built-in default variants (default-1..3)
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
	const iconRef = config.settings.layout.iconUrl ?? "default-1";
	const animationClass = config.settings.layout.iconAnimation || "";
	const burstDuration = `${Math.max(
		0.2,
		1 / Math.max(0.1, config.settings.layout.iconAnimationSpeed || 1),
	)}s`;

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
				className={`iconAnimationContainer ${animationClass}`}
				aria-hidden
				style={{ "--icon-burst-duration": burstDuration } as React.CSSProperties}
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
				className={`iconAnimationContainer ${animationClass}`}
				style={{ "--icon-burst-duration": burstDuration } as React.CSSProperties}
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
				className={`iconAnimationContainer ${animationClass}`}
				style={
					{
						width: 20,
						height: 20,
						display: "inline-block",
						"--icon-burst-duration": burstDuration,
					} as React.CSSProperties
				}
			/>
		);
	}

	// Fallback
	return (
		<ChatIconSvg
			aria-hidden
			className={`iconAnimationContainer ${animationClass}`}
			style={{ "--icon-burst-duration": burstDuration } as React.CSSProperties}
		/>
	);
};

export default ChatIcon;
