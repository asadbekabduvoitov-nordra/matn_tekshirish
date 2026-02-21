import { Markup } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { env } from "../../config/index.js";
import {
  userService,
  permissionService,
} from "../../services/index.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("payment-handler");

export async function handleSendPaymentCheck(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();

  ctx.session.awaiting_payment_check = true;

  await ctx.reply("📸 Iltimos, to'lov chekingizning rasmini yuboring.");
}

export async function handlePaymentPhoto(
  ctx: BotContext
): Promise<void> {
  if (!ctx.session.awaiting_payment_check) {
    return;
  }

  if (!ctx.message || !("photo" in ctx.message)) {
    return;
  }

  const photos = ctx.message.photo;
  const largestPhoto = photos[photos.length - 1];
  const telegramId = ctx.from!.id;
  const firstName = ctx.user?.first_name ?? ctx.from?.first_name ?? "Foydalanuvchi";

  try {
    await ctx.telegram.sendPhoto(
      env.PAYMENT_CHAT_ID,
      largestPhoto.file_id,
      {
        caption: `🧾 Yangi to'lov cheki\n\n👤 Ism: ${firstName}\n🆔 Telegram ID: ${telegramId}`,
        ...Markup.inlineKeyboard([
          [Markup.button.callback("✅ Tasdiqlash", `approve:${telegramId}`)],
          [Markup.button.callback("❌ Rad etish", `reject:${telegramId}`)],
          [Markup.button.callback("🚫 Bloklash", `block:${telegramId}`)],
        ]),
      }
    );

    await ctx.reply("✅ Chekingiz qabul qilindi. Tekshirilgandan so'ng sizga xabar beramiz. ⏳");

    ctx.session.awaiting_payment_check = false;

    logger.info(
      { telegramId, firstName },
      "Payment check forwarded to admin group"
    );
  } catch (error) {
    logger.error({ error, telegramId }, "Failed to forward payment check");
    await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
  }
}

export async function handleApprovePayment(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData =
    "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const telegramId = Number(callbackData.replace("approve:", ""));

  try {
    const user = await userService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.reply("⚠️ Foydalanuvchi topilmadi.");
      return;
    }

    await permissionService.approve(user.id);

    await ctx.telegram.sendMessage(
      telegramId,
      "🎉 To'lovingiz tasdiqlandi!\n\nEndi esse tekshirish xizmatidan foydalanishingiz mumkin.",
      {
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "📝 Esse tekshirish",
              "matn_tekshirish"
            ),
          ],
        ]),
      }
    );

    await ctx.editMessageCaption(
      `✅ ${user.first_name} (${telegramId}) — tasdiqlandi`,
      { reply_markup: { inline_keyboard: [] } }
    );

    logger.info(
      { telegramId, userId: user.id },
      "Payment approved by admin"
    );
  } catch (error) {
    logger.error({ error, telegramId }, "Failed to approve payment");
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}

export async function handleRejectPayment(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData =
    "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const telegramId = Number(callbackData.replace("reject:", ""));

  try {
    const user = await userService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.reply("⚠️ Foydalanuvchi topilmadi.");
      return;
    }

    await permissionService.reject(user.id);

    await ctx.telegram.sendMessage(
      telegramId,
      "❌ To'lovingiz rad etildi.\n\nIltimos, to'lov chekini qaytadan yuboring. Chekda barcha ma'lumotlar aniq ko'rinishiga ishonch hosil qiling."
    );

    await ctx.editMessageCaption(
      `❌ ${user.first_name} (${telegramId}) — rad etildi`,
      { reply_markup: { inline_keyboard: [] } }
    );

    logger.info(
      { telegramId, userId: user.id },
      "Payment rejected by admin"
    );
  } catch (error) {
    logger.error({ error, telegramId }, "Failed to reject payment");
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}

export async function handleBlockPayment(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();

  const callbackData =
    "data" in ctx.callbackQuery! ? ctx.callbackQuery.data : "";
  const telegramId = Number(callbackData.replace("block:", ""));

  try {
    const user = await userService.findByTelegramId(telegramId);

    if (!user) {
      await ctx.reply("⚠️ Foydalanuvchi topilmadi.");
      return;
    }

    await permissionService.block(user.id);
    await userService.update(telegramId, { status: "BANNED" });

    await ctx.telegram.sendMessage(
      telegramId,
      "🚫 Siz bloklangansiz va botdan foydalana olmaysiz."
    );

    await ctx.editMessageCaption(
      `🚫 ${user.first_name} (${telegramId}) — bloklandi`,
      { reply_markup: { inline_keyboard: [] } }
    );

    logger.info(
      { telegramId, userId: user.id },
      "User blocked by admin"
    );
  } catch (error) {
    logger.error({ error, telegramId }, "Failed to block user");
    await ctx.reply("❌ Xatolik yuz berdi.");
  }
}
