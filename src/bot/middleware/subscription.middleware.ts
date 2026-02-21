import { Markup } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { env } from "../../config/index.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("subscription-middleware");

export async function subscriptionMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  if (!ctx.from) {
    return next();
  }

  // Skip subscription check for callback queries - they have their own handling
  if (ctx.callbackQuery) {
    return next();
  }

  try {
    // Check if user is a member of the required channel
    const chatMember = await ctx.telegram.getChatMember(
      env.REQUIRED_CHANNEL,
      ctx.from.id
    );

    const validStatuses = ["creator", "administrator", "member"];

    if (validStatuses.includes(chatMember.status)) {
      // User is subscribed, allow them to continue
      return next();
    }

    // User is not subscribed
    logger.info(
      { telegramId: ctx.from.id, status: chatMember.status },
      "User attempted to use bot without subscription"
    );

    await ctx.reply(
      "❌ Botdan foydalanish uchun kanalimizga obuna bo'lishingiz kerak!\n\n" +
      "📢 Kanalga obuna bo'ling va qayta urinib ko'ring.",
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📢 Kanalga obuna bo'lish",
            `https://t.me/${env.REQUIRED_CHANNEL.replace("@", "")}`
          ),
        ],
        [Markup.button.callback("✅ Obunani tekshirish", "check_subscription")],
      ])
    );
  } catch (error) {
    // If there's an error checking membership (e.g., bot is not admin in channel),
    // log it and allow the user to continue
    logger.error(
      { error, telegramId: ctx.from.id },
      "Error checking channel membership"
    );

    // Allow user to continue in case of errors
    return next();
  }
}
