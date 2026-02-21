import { Markup, Scenes } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { env } from "../../config/index.js";
import { submissionService, permissionService } from "../../services/index.js";
import { sendWithRetry, sleep } from "../../utils/helpers.js";
import type { BotContext, CollectedMessage } from "../../types/index.js";

const logger = createChildLogger("matn-tekshirish-scene");

const SEND_DELAY_MS = 100;

export const matnTekshirishScene = new Scenes.BaseScene<BotContext>(
  "matn_tekshirish"
);

matnTekshirishScene.enter(async (ctx) => {
  ctx.session.collectedMessages = [];
  ctx.session.lastConfirmationMessageId = undefined;

  const message =
    `📝 Esse tekshirish xizmatiga xush kelibsiz!\n\n` +
    `Tekshirmoqchi bo'lgan essangizni rasm yoki matn ko'rinishida yuboring.\n\n` +
    `📎 Bir nechta xabar yuborish mumkin.\n` +
    `✅ Tayyor bo'lgach, "Tayyor" tugmasini bosing.\n\n` +
    `❌ Bekor qilish uchun /cancel`;

  await ctx.reply(message);
});

matnTekshirishScene.command("cancel", async (ctx) => {
  ctx.session.collectedMessages = [];
  await ctx.reply("❌ Bekor qilindi.\n\nQaytadan boshlash uchun /start buyrug'ini yuboring.");
  await ctx.scene.leave();
});

matnTekshirishScene.action("confirm_done", async (ctx) => {
  await ctx.answerCbQuery();

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
    await ctx.reply("⚠️ Hech qanday xabar topilmadi. Iltimos, avval rasm yoki matn yuboring.");
    return;
  }

  await ctx.reply(`📤 ${messages.length} ta xabar yuborilmoqda...`);

  const userName = ctx.user?.first_name ?? ctx.from?.first_name ?? "Foydalanuvchi";
  const userId = ctx.from?.id!;

  try {
    const headerMessage = await sendWithRetry(() =>
      ctx.telegram.sendMessage(
        env.GROUP_CHAT_ID,
        `📝 Yangi esse tekshirish so'rovi\n\n👤 Foydalanuvchi: ${userName}\n📊 Xabarlar soni: ${messages.length}`,
      )
    );

    for (const msg of messages) {
      await sleep(SEND_DELAY_MS);
      if (msg.type === "photo" && msg.fileId) {
        await sendWithRetry(() =>
          ctx.telegram.sendPhoto(env.GROUP_CHAT_ID, msg.fileId!)
        );
      } else if (msg.type === "text" && msg.text) {
        await sendWithRetry(() =>
          ctx.telegram.sendMessage(env.GROUP_CHAT_ID, msg.text!)
        );
      }
    }

    const submission = await submissionService.create(
      userId,
      userName,
      headerMessage.message_id,
      messages
    );

    await sleep(SEND_DELAY_MS);
    await sendWithRetry(() =>
      ctx.telegram.sendMessage(
        env.GROUP_CHAT_ID,
        `💬 ${userName} — javob berish uchun bu xabarga reply qiling`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback("📝 Javob berilmoqda", `mark_in_progress_${submission.id}`)],
            [Markup.button.callback("⏳ Kutib turing", `mark_waiting_${submission.id}`)],
            [Markup.button.callback("✅ Javob berildi", `mark_answered_${submission.id}`)],
          ]),
        }
      )
    );

    if (ctx.session.activePermissionId) {
      await permissionService.consumeAccess(ctx.session.activePermissionId);
      ctx.session.activePermissionId = undefined;
    }

    await ctx.reply("✅ Essangiz tekshirish uchun qabul qilindi. Tez orada javob beramiz!");

    logger.info(
      { userId, messageCount: messages.length, submissionId: submission.id },
      "Messages forwarded to group"
    );
  } catch (error) {
    logger.error({ error, userId }, "Failed to forward messages to group");
    await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
  }

  ctx.session.collectedMessages = [];
  await ctx.scene.leave();
});

matnTekshirishScene.action("add_more", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("📎 Yana rasm yoki matn yuborishingiz mumkin.");
});

function getConfirmationKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✅ Tayyor", "confirm_done")],
    [Markup.button.callback("➕ Yana qo'shish", "add_more")],
  ]);
}

async function showConfirmationAtBottom(ctx: BotContext, count: number): Promise<void> {
  const confirmText = `📊 Jami: ${count} ta xabar qabul qilindi\n\nYana yubormoqchimisiz yoki tayyor bo'ldingizmi?`;

  // Delete old confirmation message so the new one always appears at the bottom
  if (ctx.session.lastConfirmationMessageId) {
    ctx.telegram.deleteMessage(ctx.chat!.id, ctx.session.lastConfirmationMessageId).catch(() => {});
  }

  const sentMessage = await ctx.reply(confirmText, {
    ...getConfirmationKeyboard(),
  });
  ctx.session.lastConfirmationMessageId = sentMessage.message_id;
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

  await showConfirmationAtBottom(ctx, ctx.session.collectedMessages.length);
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

  await showConfirmationAtBottom(ctx, ctx.session.collectedMessages.length);
});
