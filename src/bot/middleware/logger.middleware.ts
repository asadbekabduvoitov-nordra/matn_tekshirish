import { createChildLogger } from "../../lib/logger.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("bot");

export async function loggerMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  const start = Date.now();

  const updateType = ctx.updateType;
  const userId = ctx.from?.id;
  const chatId = ctx.chat?.id;
  const message = ctx.message;

  logger.debug(
    { updateType, userId, chatId, message },
    `Incoming ${updateType}`
  );

  await next();

  const duration = Date.now() - start;
  logger.debug(
    { updateType, userId, duration },
    `Processed ${updateType} in ${duration}ms`
  );
}
