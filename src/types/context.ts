import type { Context, Scenes } from "telegraf";
import type { Tables } from "./database.types.js";

export interface CollectedMessage {
  messageId: number;
  type: "photo" | "text";
  fileId?: string;
  text?: string;
}

export interface SessionData extends Scenes.SceneSession {
  messageCount?: number;
  collectedMessages?: CollectedMessage[];
  lastConfirmationMessageId?: number;
  awaiting_payment_check?: boolean;
  activePermissionId?: string;
}

export interface BotContext extends Context {
  session: SessionData;
  scene: Scenes.SceneContextScene<BotContext>;
  user?: Tables<"users">;
}
