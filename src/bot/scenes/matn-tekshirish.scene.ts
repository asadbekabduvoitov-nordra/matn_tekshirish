import { Markup, Scenes } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { env } from "../../config/index.js";
import { submissionService } from "../../services/index.js";
import type { BotContext, CollectedMessage } from "../../types/index.js";

const logger = createChildLogger("matn-tekshirish-scene");

export const matnTekshirishScene = new Scenes.BaseScene<BotContext>(
  "matn_tekshirish"
);

matnTekshirishScene.enter(async (ctx) => {
  ctx.session.collectedMessages = [];
  ctx.session.lastConfirmationMessageId = undefined;

  const message = `
📸 *Matn tekshirish xizmatiga xush kelibsiz!*

Iltimos, tekshirmoqchi bo'lgan matnlaringizni yuboring.

✨ *Qanday qilish kerak:*
• Rasmlar yoki matnlar yuborishingiz mumkin
• Bir nechta xabar yuborishingiz mumkin
• Tayyor bo'lgach, "✅ Tayyor" tugmasini bosing

_Bekor qilish uchun /cancel buyrug'ini yuboring_
  `.trim();

  await ctx.reply(message, { parse_mode: "Markdown" });
});

matnTekshirishScene.command("cancel", async (ctx) => {
  ctx.session.collectedMessages = [];
  await ctx.reply(
    "❌ Bekor qilindi. Qaytadan boshlash uchun /start buyrug'ini yuboring.",
    { parse_mode: "Markdown" }
  );
  await ctx.scene.leave();
});

matnTekshirishScene.action("confirm_done", async (ctx) => {
  await ctx.answerCbQuery();

  // Delete the confirmation message
  if (ctx.session.lastConfirmationMessageId) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.lastConfirmationMessageId);
    } catch {
      // Message might already be deleted
    }
    ctx.session.lastConfirmationMessageId = undefined;
  }

  const messages = ctx.session.collectedMessages ?? [];

  if (messages.length === 0) {
    await ctx.reply(
      "⚠️ Hech qanday xabar topilmadi. Iltimos, avval rasm yoki matn yuboring.",
      { parse_mode: "Markdown" }
    );
    return;
  }

  await ctx.reply(
    `📤 *${messages.length} ta xabar guruhga yuborilmoqda...*`,
    { parse_mode: "Markdown" }
  );

  const userName = ctx.user?.first_name ?? ctx.from?.first_name ?? "Foydalanuvchi";
  const userId = ctx.from?.id!;

  try {
    const headerMessage = await ctx.telegram.sendMessage(
      env.GROUP_CHAT_ID,
      `📝 *Yangi matn tekshirish so'rovi*\n\n👤 Foydalanuvchi: ${userName}\n🆔 ID: ${userId}\n📊 Xabarlar soni: ${messages.length}\n\n⏳ *Status:* Javob kutilmoqda`,
      { parse_mode: "Markdown" }
    );

    for (const msg of messages) {
      if (msg.type === "photo" && msg.fileId) {
        await ctx.telegram.sendPhoto(env.GROUP_CHAT_ID, msg.fileId);
      } else if (msg.type === "text" && msg.text) {
        await ctx.telegram.sendMessage(env.GROUP_CHAT_ID, msg.text);
      }
    }

    const submission = await submissionService.create(
      userId,
      userName,
      headerMessage.message_id,
      messages
    );

    await ctx.telegram.sendMessage(
      env.GROUP_CHAT_ID,
      `📋 *So'rov ID:* \`${submission.id}\`\n\n_Javob berish uchun bu xabarga reply qiling_`,
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.callback("⏳ Javob berilmagan", `status_pending_${submission.id}`)],
          [Markup.button.callback("✅ Javob berildi", `mark_answered_${submission.id}`)],
        ]),
      }
    );

    await ctx.reply(
      "✅ *Muvaffaqiyatli yuborildi!*\n\nXabarlaringiz tekshirish uchun qabul qilindi. Tez orada javob beramiz!",
      { parse_mode: "Markdown" }
    );

    logger.info(
      { userId, messageCount: messages.length, submissionId: submission.id },
      "Messages forwarded to group"
    );
  } catch (error) {
    logger.error({ error, userId }, "Failed to forward messages to group");
    await ctx.reply(
      "❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.",
      { parse_mode: "Markdown" }
    );
  }

  ctx.session.collectedMessages = [];
  await ctx.scene.leave();
});

matnTekshirishScene.action("add_more", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    "📎 Yana rasm yoki matn yuborishingiz mumkin.",
    { parse_mode: "Markdown" }
  );
});

function getConfirmationKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ Tayyor", "confirm_done")],
    [Markup.button.callback("➕ Yana qo'shish", "add_more")],
  ]);
}

matnTekshirishScene.on("photo", async (ctx) => {
  const photos = ctx.message.photo;
  const largestPhoto = photos[photos.length - 1];

  if (!ctx.session.collectedMessages) {
    ctx.session.collectedMessages = [];
  }

  const collectedMessage: CollectedMessage = {
    messageId: ctx.message.message_id,
    type: "photo",
    fileId: largestPhoto.file_id,
  };

  ctx.session.collectedMessages.push(collectedMessage);

  logger.info(
    { userId: ctx.from?.id, fileId: largestPhoto.file_id, count: ctx.session.collectedMessages.length },
    "Photo added to collection"
  );

  const confirmText = `📊 Jami: ${ctx.session.collectedMessages.length} ta xabar qabul qilindi\n\nYana yubormoqchimisiz yoki tayyor bo'ldingizmi?`;

  // Delete old confirmation message and send new one at the bottom
  if (ctx.session.lastConfirmationMessageId) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.lastConfirmationMessageId);
    } catch {
      // Message might already be deleted
    }
  }

  const sentMessage = await ctx.reply(confirmText, {
    parse_mode: "Markdown",
    ...getConfirmationKeyboard(),
  });
  ctx.session.lastConfirmationMessageId = sentMessage.message_id;
});

matnTekshirishScene.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (text.startsWith("/")) {
    return;
  }

  if (!ctx.session.collectedMessages) {
    ctx.session.collectedMessages = [];
  }

  const collectedMessage: CollectedMessage = {
    messageId: ctx.message.message_id,
    type: "text",
    text: text,
  };

  ctx.session.collectedMessages.push(collectedMessage);

  logger.info(
    { userId: ctx.from?.id, textLength: text.length, count: ctx.session.collectedMessages.length },
    "Text added to collection"
  );

  const confirmText = `📊 Jami: ${ctx.session.collectedMessages.length} ta xabar qabul qilindi\n\nYana yubormoqchimisiz yoki tayyor bo'ldingizmi?`;

  // Delete old confirmation message and send new one at the bottom
  if (ctx.session.lastConfirmationMessageId) {
    try {
      await ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.lastConfirmationMessageId);
    } catch {
      // Message might already be deleted
    }
  }

  const sentMessage = await ctx.reply(confirmText, {
    parse_mode: "Markdown",
    ...getConfirmationKeyboard(),
  });
  ctx.session.lastConfirmationMessageId = sentMessage.message_id;
});
