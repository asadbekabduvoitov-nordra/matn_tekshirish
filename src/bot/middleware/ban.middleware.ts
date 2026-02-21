import { createChildLogger } from "../../lib/logger.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("ban-middleware");

export async function banMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  if (!ctx.user) {
    return next();
  }

  if (ctx.user.status === "BANNED") {
    logger.warn(
      { telegramId: ctx.from?.id },
      "Banned user attempted interaction"
    );
    await ctx.reply(
      "🚫 Siz bloklangansiz va botdan foydalana olmaysiz."
    );
    return;
  }

  return next();
}
