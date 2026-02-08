import { Markup } from "telegraf";
import type { BotContext } from "../../types/index.js";

export async function startCommand(ctx: BotContext): Promise<void> {
  const firstName = ctx.user?.first_name ?? ctx.from?.first_name ?? "do'st";

  const welcomeMessage = `
🎉 *Assalomu alaykum, ${firstName}!*

Matn Tekshirish botiga xush kelibsiz! 🤖

📝 *Bot imkoniyatlari:*
• Rasmdan matnni aniqlash va tekshirish
• Imlo xatolarini topish
• Matn sifatini baholash

Boshlash uchun quyidagi tugmani bosing 👇
  `.trim();

  await ctx.reply(welcomeMessage, {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([
      [Markup.button.callback("📝 Matn Tekshirish", "matn_tekshirish")],
    ]),
  });
}
