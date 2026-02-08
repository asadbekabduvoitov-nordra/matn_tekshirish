import { Telegraf, session } from "telegraf";
import { env, isDev } from "../config/index.js";
import { createChildLogger } from "../lib/logger.js";
import type { BotContext, SessionData } from "../types/index.js";
import {
  authMiddleware,
  loggerMiddleware,
  errorMiddleware,
} from "./middleware/index.js";
import { registerCommands } from "./commands/index.js";
import { registerHandlers } from "./handlers/index.js";
import { createStage } from "./scenes/index.js";

const logger = createChildLogger("bot");

export function createBot(): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(env.BOT_TOKEN);

  bot.use(
    session<SessionData, BotContext>({
      defaultSession: () => ({}),
    })
  );

  const stage = createStage();
  bot.use(stage.middleware());

  bot.use(errorMiddleware);
  bot.use(loggerMiddleware);
  bot.use(authMiddleware);

  registerCommands(bot);
  registerHandlers(bot);

  logger.info("Bot configured");

  return bot;
}

export async function startBot(bot: Telegraf<BotContext>): Promise<void> {
  // Register commands with Telegram so they appear in the command menu
  await bot.telegram.setMyCommands([
    { command: "start", description: "Botni ishga tushirish" },
    { command: "matn_tekshirish", description: "Matn tekshirish xizmatini boshlash" },
    { command: "help", description: "Yordam va buyruqlar ro'yxati" },
  ]);
  logger.info("Bot commands registered");

  if (isDev) {
    logger.info("Starting bot in polling mode...");
    await bot.launch();
    logger.info("Bot started in polling mode");
  } else {
    logger.info("Bot configured for webhook mode");
  }
}

export async function stopBot(bot: Telegraf<BotContext>): Promise<void> {
  bot.stop("SIGTERM");
  logger.info("Bot stopped");
}
