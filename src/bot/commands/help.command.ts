import type { BotContext } from "../../types/index.js";

export async function helpCommand(ctx: BotContext): Promise<void> {
  const helpText =
    `📝 Esse Tekshirish Bot\n\n` +
    `Bu bot orqali essalaringizni tekshirish uchun yuborishingiz mumkin.\n\n` +
    `📚 Mavjud buyruqlar:\n\n` +
    `/start - 🚀 Botni ishga tushirish\n` +
    `/matn_tekshirish - 📝 Esse tekshirish xizmatini boshlash\n` +
    `/help - ❓ Yordam\n\n` +
    `📋 Qanday foydalanish:\n` +
    `1️⃣ /matn_tekshirish buyrug'ini yuboring\n` +
    `2️⃣ Tekshirmoqchi bo'lgan rasm yoki matnlarni yuboring\n` +
    `3️⃣ "✅ Tayyor" tugmasini bosing\n` +
    `4️⃣ Javobni kuting ⏳`;

  await ctx.reply(helpText);
}
