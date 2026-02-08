import { userService } from "../../services/index.js";
import { createChildLogger } from "../../lib/logger.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("auth-middleware");

export async function authMiddleware(
  ctx: BotContext,
  next: () => Promise<void>
): Promise<void> {
  const from = ctx.from;

  if (!from) {
    logger.warn("No user in context");
    return next();
  }

  try {
    const user = await userService.upsert({
      telegram_id: from.id,
      first_name: from.first_name,
      last_name: from.last_name ?? null,
      language_code: from.language_code ?? null,
    });

    ctx.user = user;
  } catch (error) {
    logger.error({ error, telegramId: from.id }, "Failed to authenticate user");
  }

  return next();
}
