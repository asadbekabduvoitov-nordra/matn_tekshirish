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

  const submissionMatch = replyToMessage.text.match(/javob berish uchun bu xabarga reply qiling/i);
  if (!submissionMatch) {
    return;
  }

  // Find submission by looking at the callback buttons on the message
  const replyMarkup = replyToMessage.reply_markup;
  if (!replyMarkup || !("inline_keyboard" in replyMarkup)) {
    return;
  }

  const buttons = replyMarkup.inline_keyboard.flat();
  const inProgressButton = buttons.find((b) => "callback_data" in b && b.callback_data?.startsWith("mark_in_progress_"));
  const waitingButton = buttons.find((b) => "callback_data" in b && b.callback_data?.startsWith("mark_waiting_"));
  const answeredButton = buttons.find((b) => "callback_data" in b && b.callback_data?.startsWith("mark_answered_"));
  const buttonWithId = inProgressButton ?? waitingButton ?? answeredButton;

  if (!buttonWithId || !("callback_data" in buttonWithId) || !buttonWithId.callback_data) {
    return;
  }

  const submissionId = buttonWithId.callback_data
    .replace("mark_in_progress_", "")
    .replace("mark_waiting_", "")
    .replace("mark_answered_", "");

  try {
    const submission = await submissionService.findById(submissionId);

    if (!submission) {
      await ctx.reply("⚠️ So'rov topilmadi.");
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.reply("⚠️ Bu so'rovga allaqachon javob berilgan.");
      return;
    }

    const userTelegramId = submission.user_telegram_id;

    const caption = "caption" in ctx.message ? ctx.message.caption : undefined;
    const replyHeader = `📬 Javob keldi!\n\n`;

    if ("text" in ctx.message && ctx.message.text) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        `${replyHeader}${ctx.message.text}`,
      );
    } else if ("photo" in ctx.message && ctx.message.photo) {
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      await ctx.telegram.sendPhoto(userTelegramId, photo.file_id, {
        caption: `${replyHeader}${caption ?? ""}`,
      });
    } else if ("video" in ctx.message && ctx.message.video) {
      await ctx.telegram.sendVideo(userTelegramId, ctx.message.video.file_id, {
        caption: `${replyHeader}${caption ?? ""}`,
      });
    } else if ("audio" in ctx.message && ctx.message.audio) {
      await ctx.telegram.sendAudio(userTelegramId, ctx.message.audio.file_id, {
        caption: `${replyHeader}${caption ?? ""}`,
      });
    } else if ("voice" in ctx.message && ctx.message.voice) {
      await ctx.telegram.sendVoice(userTelegramId, ctx.message.voice.file_id, {
        caption: `${replyHeader}${caption ?? ""}`,
      });
    } else if ("video_note" in ctx.message && ctx.message.video_note) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        `${replyHeader}🎥 Video xabar:`,
      );
      await ctx.telegram.sendVideoNote(userTelegramId, ctx.message.video_note.file_id);
    } else if ("document" in ctx.message && ctx.message.document) {
      await ctx.telegram.sendDocument(userTelegramId, ctx.message.document.file_id, {
        caption: `${replyHeader}${caption ?? ""}`,
      });
    } else if ("sticker" in ctx.message && ctx.message.sticker) {
      await ctx.telegram.sendMessage(
        userTelegramId,
        replyHeader,
      );
      await ctx.telegram.sendSticker(userTelegramId, ctx.message.sticker.file_id);
    } else {
      await ctx.reply("⚠️ Bu turdagi xabarni yuborib bo'lmadi.");
      return;
    }

    await ctx.reply(
      `✅ Javob ${submission.user_first_name}ga yuborildi.`,
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

export async function handleMarkInProgress(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData = "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const submissionId = callbackData.replace("mark_in_progress_", "");

  try {
    const submission = await submissionService.findById(submissionId);

    if (!submission) {
      await ctx.answerCbQuery("⚠️ So'rov topilmadi", { show_alert: true });
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.answerCbQuery("✅ Allaqachon javob berilgan", { show_alert: true });
      return;
    }

    const userTelegramId = submission.user_telegram_id;

    await ctx.telegram.sendMessage(
      userTelegramId,
      `📝 Hurmatli foydalanuvchi!\n\n` +
      `Sizning essangiz tekshirish jarayoniga qabul qilindi va hozirda mutaxassislarimiz tomonidan ko'rib chiqilmoqda.\n\n` +
      `⏳ Iltimos, biroz kuting — tez orada natija sizga yuboriladi!`
    );

    await ctx.editMessageText(
      `📝 ${submission.user_first_name} — ko'rib chiqilmoqda\n\n💬 Javob berish uchun bu xabarga reply qiling`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📝 Javob berilmoqda", `mark_in_progress_${submissionId}`)],
          [Markup.button.callback("⏳ Kutib turing", `mark_waiting_${submissionId}`)],
          [Markup.button.callback("✅ Javob berildi", `mark_answered_${submissionId}`)],
        ]),
      }
    );

    logger.info(
      { submissionId, adminId: ctx.from?.id, userId: userTelegramId },
      "Submission marked as in progress, user notified"
    );
  } catch (error) {
    logger.error({ error, submissionId }, "Failed to mark as in progress");
    await ctx.answerCbQuery("❌ Xatolik yuz berdi", { show_alert: true });
  }
}

export async function handleMarkWaiting(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData = "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const submissionId = callbackData.replace("mark_waiting_", "");

  try {
    const submission = await submissionService.findById(submissionId);

    if (!submission) {
      await ctx.answerCbQuery("⚠️ So'rov topilmadi", { show_alert: true });
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.answerCbQuery("✅ Allaqachon javob berilgan", { show_alert: true });
      return;
    }

    const userTelegramId = submission.user_telegram_id;

    await ctx.telegram.sendMessage(
      userTelegramId,
      `⏳ Hurmatli foydalanuvchi!\n\n` +
      `Hozirda tekshirish uchun ko'plab so'rovlar mavjud. Sizning essangiz navbatga qo'yildi va yaqin soatlar ichida ko'rib chiqiladi.\n\n` +
      `🙏 Sabringiz uchun rahmat — siz uchun eng yaxshi natijani taqdim etishga harakat qilamiz!`
    );

    await ctx.editMessageText(
      `⏳ ${submission.user_first_name} — navbatda kutmoqda\n\n💬 Javob berish uchun bu xabarga reply qiling`,
      {
        ...Markup.inlineKeyboard([
          [Markup.button.callback("📝 Javob berilmoqda", `mark_in_progress_${submissionId}`)],
          [Markup.button.callback("⏳ Kutib turing", `mark_waiting_${submissionId}`)],
          [Markup.button.callback("✅ Javob berildi", `mark_answered_${submissionId}`)],
        ]),
      }
    );

    logger.info(
      { submissionId, adminId: ctx.from?.id, userId: userTelegramId },
      "Submission marked as waiting, user notified"
    );
  } catch (error) {
    logger.error({ error, submissionId }, "Failed to mark as waiting");
    await ctx.answerCbQuery("❌ Xatolik yuz berdi", { show_alert: true });
  }
}

export async function handleMarkAnswered(ctx: BotContext): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData = "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const submissionId = callbackData.replace("mark_answered_", "");

  try {
    const submission = await submissionService.findById(submissionId);

    if (!submission) {
      await ctx.answerCbQuery("⚠️ So'rov topilmadi", { show_alert: true });
      return;
    }

    if (submission.status === "ANSWERED") {
      await ctx.answerCbQuery("✅ Allaqachon javob berilgan", { show_alert: true });
      return;
    }

    await submissionService.markAsAnswered(submissionId, ctx.from?.id!);

    const userTelegramId = submission.user_telegram_id;

    await ctx.telegram.sendMessage(
      userTelegramId,
      `✅ Tabriklaymiz!\n\n` +
      `Sizning essangiz to'liq ko'rib chiqildi va tekshiruv yakunlandi.\n\n` +
      `📩 Javob yuqoridagi xabarlarda yuborilgan. Agar qo'shimcha savollaringiz bo'lsa, yangi so'rov yuborishingiz mumkin.\n\n` +
      `🌟 Xizmatimizdan foydalanganingiz uchun rahmat!`
    );

    await ctx.editMessageText(
      `✅ ${submission.user_first_name} — javob berildi`
    );

    logger.info(
      { submissionId, adminId: ctx.from?.id, userId: userTelegramId },
      "Submission marked as answered, user notified"
    );
  } catch (error) {
    logger.error({ error, submissionId }, "Failed to mark as answered");
    await ctx.answerCbQuery("❌ Xatolik yuz berdi", { show_alert: true });
  }
}
