import { Markup } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { env } from "../../config/index.js";
import { submissionService } from "../../services/index.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("admin-handler");

export async function handleAdminReply(ctx: BotContext): Promise<void> {
  if (!ctx.message || !("reply_to_message" in ctx.message) || !ctx.message.reply_to_message) {
    return;
  }

  const chatId = ctx.chat?.id;
  if (chatId !== env.GROUP_CHAT_ID) {
    return;
  }

  const replyToMessage = ctx.message.reply_to_message;
  
  if (!("text" in replyToMessage) || !replyToMessage.text) {
    return;
  }

  const submissionIdMatch = replyToMessage.text.match(/So'rov ID:\s*`?([a-f0-9-]+)`?/i);
  if (!submissionIdMatch) {
    return;
  }

  const submissionId = submissionIdMatch[1];
  
  try {
    const submission = await submissionService.findById(submissionId);
    
    if (!submission) {
      await ctx.reply("❌ So'rov topilmadi.", { parse_mode: "Markdown" });
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.reply(
        "⚠️ Bu so'rovga allaqachon javob berilgan.",
        { parse_mode: "Markdown" }
      );
      return;
    }

    const userTelegramId = submission.user_telegram_id;
    const adminName = ctx.from?.first_name ?? "Admin";

    const caption = "caption" in ctx.message ? ctx.message.caption : undefined;
    const replyHeader = `📬 *Javob keldi!*\n\n`;
    const replyFooter = `\n\n_${adminName} tomonidan_`;

    if ("text" in ctx.message && ctx.message.text) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        `${replyHeader}${ctx.message.text}${replyFooter}`,
        { parse_mode: "Markdown" }
      );
    } else if ("photo" in ctx.message && ctx.message.photo) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      await ctx.telegram.sendPhoto(userTelegramId, photo.file_id, {
        caption: `${replyHeader}${caption ?? ""}${replyFooter}`,
        parse_mode: "Markdown",
      });
    } else if ("video" in ctx.message && ctx.message.video) {
      await ctx.telegram.sendVideo(userTelegramId, ctx.message.video.file_id, {
        caption: `${replyHeader}${caption ?? ""}${replyFooter}`,
        parse_mode: "Markdown",
      });
    } else if ("audio" in ctx.message && ctx.message.audio) {
      await ctx.telegram.sendAudio(userTelegramId, ctx.message.audio.file_id, {
        caption: `${replyHeader}${caption ?? ""}${replyFooter}`,
        parse_mode: "Markdown",
      });
    } else if ("voice" in ctx.message && ctx.message.voice) {
      await ctx.telegram.sendVoice(userTelegramId, ctx.message.voice.file_id, {
        caption: `${replyHeader}${caption ?? ""}${replyFooter}`,
        parse_mode: "Markdown",
      });
    } else if ("video_note" in ctx.message && ctx.message.video_note) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        `${replyHeader}Video xabar:${replyFooter}`,
        { parse_mode: "Markdown" }
      );
      await ctx.telegram.sendVideoNote(userTelegramId, ctx.message.video_note.file_id);
    } else if ("document" in ctx.message && ctx.message.document) {
      await ctx.telegram.sendDocument(userTelegramId, ctx.message.document.file_id, {
        caption: `${replyHeader}${caption ?? ""}${replyFooter}`,
        parse_mode: "Markdown",
      });
    } else if ("sticker" in ctx.message && ctx.message.sticker) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        `${replyHeader}${replyFooter}`,
        { parse_mode: "Markdown" }
      );
      await ctx.telegram.sendSticker(userTelegramId, ctx.message.sticker.file_id);
    } else {
      await ctx.reply("⚠️ Bu turdagi xabarni yuborib bo'lmadi.");
      return;
    }

    await ctx.reply(
      `✅ Javob foydalanuvchiga yuborildi (${submission.user_first_name})`,
      { parse_mode: "Markdown" }
    );

    logger.info(
      { submissionId, adminId: ctx.from?.id, userId: userTelegramId },
      "Admin reply sent to user"
    );
  } catch (error) {
    logger.error({ error, submissionId }, "Failed to send admin reply");
    await ctx.reply("❌ Xatolik yuz berdi. Javob yuborilmadi.");
  }
}

export async function handleMarkAnswered(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData = "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const submissionId = callbackData.replace("mark_answered_", "");

  try {
    const submission = await submissionService.findById(submissionId);

    if (!submission) {
      await ctx.answerCbQuery("So'rov topilmadi", { show_alert: true });
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.answerCbQuery("Allaqachon javob berilgan", { show_alert: true });
      return;
    }

    await submissionService.markAsAnswered(submissionId, ctx.from?.id!);

    await ctx.editMessageText(
      `📋 *So'rov ID:* \`${submissionId}\`\n\n✅ *Javob berildi*\n_${ctx.from?.first_name} tomonidan_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Javob berildi", `answered_${submissionId}`)],
        ]),
      }
    );

    logger.info(
      { submissionId, adminId: ctx.from?.id },
      "Submission marked as answered"
    );
  } catch (error) {
    logger.error({ error, submissionId }, "Failed to mark as answered");
    await ctx.answerCbQuery("Xatolik yuz berdi", { show_alert: true });
  }
}

export async function handleStatusPending(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery("Bu so'rovga hali javob berilmagan", { show_alert: true });
}

export async function handleAnsweredStatus(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery("Bu so'rovga javob berilgan", { show_alert: true });
}
