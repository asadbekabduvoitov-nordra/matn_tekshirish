import type { Telegraf } from "telegraf";
import type { BotContext } from "../../types/index.js";
import { startCommand } from "./start.command.js";
import { helpCommand } from "./help.command.js";
import { matnTekshirishCommand } from "./matn-tekshirish.command.js";

export function registerCommands(bot: Telegraf<BotContext>): void {
  bot.command("start", startCommand);
  bot.command("help", helpCommand);
  bot.command("matn_tekshirish", matnTekshirishCommand);
}

export { startCommand, helpCommand, matnTekshirishCommand };
