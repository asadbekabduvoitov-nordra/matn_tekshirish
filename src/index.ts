import { env, isDev } from "./config/index.js";
import { logger } from "./lib/index.js";
import { createBot, startBot, stopBot } from "./bot/index.js";
import { createServer, startServer } from "./server/index.js";

async function main(): Promise<void> {
  logger.info({ env: env.NODE_ENV }, "Starting application...");

  const bot = createBot();
  const server = createServer(bot);

  await startServer(server);

  if (isDev) {
    await startBot(bot);
  } else if (env.WEBHOOK_DOMAIN) {
    const webhookUrl = `${env.WEBHOOK_DOMAIN}/webhook/${env.WEBHOOK_SECRET ?? "bot"}`;
    await bot.telegram.setWebhook(webhookUrl);
    logger.info({ webhookUrl }, "Webhook set");
  }

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down...");
    await stopBot(bot);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  logger.info("Application started successfully");
}

main().catch((error) => {
  logger.fatal({ error }, "Failed to start application");
  process.exit(1);
});
