import express, { Express, Request, Response, NextFunction } from "express";
import { Telegraf } from "telegraf";
import { env, isDev } from "../config/index.js";
import { createChildLogger } from "../lib/logger.js";
import type { BotContext } from "../types/index.js";

const logger = createChildLogger("server");

export function createServer(bot: Telegraf<BotContext>): Express {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  if (!isDev && env.WEBHOOK_DOMAIN) {
    const webhookPath = `/webhook/${env.WEBHOOK_SECRET ?? "bot"}`;

    app.use(webhookPath, (req: Request, res: Response) => {
      bot.handleUpdate(req.body, res);
    });

    logger.info({ path: webhookPath }, "Webhook endpoint configured");
  }

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ error: err }, "Express error");
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export async function startServer(app: Express): Promise<void> {
  const port = env.PORT;

  app.listen(port, () => {
    logger.info({ port }, `Server listening on port ${port}`);
  });
}
