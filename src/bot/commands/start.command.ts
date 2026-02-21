import { Markup } from "telegraf";
import type { BotContext } from "../../types/index.js";

export async function startCommand(ctx: BotContext): Promise<void> {
  const firstName = ctx.user?.first_name ?? ctx.from?.first_name ?? "do'st";

  const welcomeMessage = `
👋 Assalomu alaykum, ${firstName}!

📝 Esse tekshirish botiga xush kelibsiz!

Bu bot orqali siz essalaringizni mutaxassislarga tekshirtirishingiz mumkin.

👇 Boshlash uchun quyidagi tugmani bosing:
  `.trim();

  await ctx.reply(welcomeMessage, {
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📝 Esse tekshirish", "matn_tekshirish")],
    ]),
  });
}
