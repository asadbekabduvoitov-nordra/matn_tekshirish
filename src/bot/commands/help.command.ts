import type { BotContext } from "../../types/index.js";

export async function helpCommand(ctx: BotContext): Promise<void> {
  const helpText = `
🤖 *Matn Tekshirish Bot*

Bu bot orqali siz matnlaringizni tekshirish uchun yuborishingiz mumkin. Rasmlar yoki matnlar yuboring va mutaxassislarimiz sizga javob berishadi.

📚 *Mavjud buyruqlar:*

/start - Botni ishga tushirish
/matn\\_tekshirish - Matn tekshirish xizmatini boshlash
/help - Yordam va buyruqlar ro'yxati

📝 *Qanday foydalanish:*
1. /matn\\_tekshirish buyrug'ini yuboring
2. Tekshirmoqchi bo'lgan rasm yoki matnlarni yuboring
3. "✅ Tayyor" tugmasini bosing
4. Javobni kuting!
  `.trim();

  await ctx.reply(helpText, { parse_mode: "Markdown" });
}
