import type { Telegraf } from "telegraf";
import type { BotContext } from "../../types/index.js";
import { handleTextMessage } from "./message.handler.js";
import { handleMatnTekshirishCallback } from "./callback.handler.js";
import {
  handleAdminReply,
  handleMarkAnswered,
  handleStatusPending,
  handleAnsweredStatus,
} from "./admin.handler.js";

export function registerHandlers(bot: Telegraf<BotContext>): void {
  bot.action("matn_tekshirish", handleMatnTekshirishCallback);
  
  bot.action(/^mark_answered_/, handleMarkAnswered);
  bot.action(/^status_pending_/, handleStatusPending);
  bot.action(/^answered_/, handleAnsweredStatus);
  
  bot.on("message", handleAdminReply);
  bot.on("text", handleTextMessage);
}

export { handleTextMessage, handleMatnTekshirishCallback };
