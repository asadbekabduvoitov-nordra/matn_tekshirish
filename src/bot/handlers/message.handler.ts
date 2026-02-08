import { createChildLogger } from "../../lib/logger.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("message-handler");

export async function handleTextMessage(ctx: BotContext): Promise<void> {
  if (!ctx.message || !("text" in ctx.message)) {
    return;
  }

  const text = ctx.message.text;
  const userId = ctx.from?.id;

  logger.debug({ userId, textLength: text.length }, "Received text message");
}
