import type { Telegraf } from "telegraf";
import type { BotContext } from "../../types/index.js";
import { handleTextMessage } from "./message.handler.js";
import {
  handleMatnTekshirishCallback,
  handleCheckSubscriptionCallback,
} from "./callback.handler.js";
import {
  handleAdminReply,
  handleMarkInProgress,
  handleMarkWaiting,
  handleMarkAnswered,
} from "./admin.handler.js";
import {
  handleSendPaymentCheck,
  handlePaymentPhoto,
  handleApprovePayment,
  handleRejectPayment,
  handleBlockPayment,
} from "./payment.handler.js";

export function registerHandlers(bot: Telegraf<BotContext>): void {
  bot.action("matn_tekshirish", handleMatnTekshirishCallback);
  bot.action("check_subscription", handleCheckSubscriptionCallback);

  // Payment actions
  bot.action("send_payment_check", handleSendPaymentCheck);
  bot.action(/^approve:/, handleApprovePayment);
  bot.action(/^reject:/, handleRejectPayment);
  bot.action(/^block:/, handleBlockPayment);

  // Submission admin actions
  bot.action(/^mark_in_progress_/, handleMarkInProgress);
  bot.action(/^mark_waiting_/, handleMarkWaiting);
  bot.action(/^mark_answered_/, handleMarkAnswered);

  // Photo handler — payment check photos are handled first (inside scene they won't reach here)
  bot.on("photo", handlePaymentPhoto);

  bot.on("message", handleAdminReply);
  bot.on("text", handleTextMessage);
}

export { handleTextMessage, handleMatnTekshirishCallback };
