import { createChildLogger } from "../../lib/logger.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("error-handler");

export async function errorMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  try {
    await next();
  } catch (error) {
    logger.error(
      {
        error,
        updateType: ctx.updateType,
        userId: ctx.from?.id,
        chatId: ctx.chat?.id,
      },
      "Unhandled error in bot"
    );

    try {
      await ctx.reply("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } catch {
      logger.error("Failed to send error message to user");
    }
  }
}
