export interface IBaseMessage {
	avatarName?: string;
	avatarUrl?: string;
	data?: Record<string, unknown> | null;
	hasReply?: boolean;
	prevMessage?: IMessage;
	source: string;
	text?: string | string[];
	timestamp?: number;
}

export interface IUserMessage extends IBaseMessage {
	source: "user";
}

export interface IBotMessage extends IBaseMessage {
	source: "bot";
	traceId: string;
}

export interface IAgentMessage extends IBaseMessage {
	source: "agent";
	traceId: string;
}

export interface IEngagementMessage extends IBaseMessage {
	source: "engagement";
	traceId: string;
}

export interface IStreamingMessage extends IBaseMessage {
	source: "bot";
	traceId: string;
	id?: string;
	animationState?: "start" | "animating" | "done" | "exited";
	finishReason?: string;
}

export type IMessage =
	| IUserMessage
	| IBotMessage
	| IAgentMessage
	| IEngagementMessage
	| IStreamingMessage;
