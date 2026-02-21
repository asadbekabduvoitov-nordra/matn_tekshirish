import { Markup } from "telegraf";
import { createChildLogger } from "../../lib/logger.js";
import { getRandomCard } from "../../lib/cards.js";
import { permissionService } from "../../services/index.js";
import type { BotContext } from "../../types/index.js";

const logger = createChildLogger("matn-tekshirish-command");

const PAYMENT_AMOUNT = "20,000";

export async function matnTekshirishCommand(ctx: BotContext): Promise<void> {
  if (!ctx.user) {
    await ctx.reply("⚠️ Iltimos, avval /start buyrug'ini yuboring.");
    return;
  }

  const permission = await permissionService.findActivePermission(ctx.user.id);

  if (permission) {
    ctx.session.activePermissionId = permission.id;
    await ctx.scene.enter("matn_tekshirish");
    return;
  }

  const card = getRandomCard();

  const paymentMessage =
    `🔒 Sizda esse tekshirish xizmatidan foydalanish uchun ruxsat mavjud emas.\n\n` +
    `💳 Xizmatdan foydalanish uchun <b>${PAYMENT_AMOUNT} so'm</b> to'lov qiling:\n\n` +
    `Karta raqami:\n<code>${card.card_number}</code>\n` +
    `Karta egasi: <b>${card.card_holder}</b>\n\n` +
    `📸 To'lovni amalga oshirgach, chek rasmini yuboring.`;

  await ctx.reply(paymentMessage, {
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "📤 To'lov chekini yuborish",
          "send_payment_check"
        ),
      ],
    ]),
  });

  logger.info(
    { telegramId: ctx.from?.id, userId: ctx.user.id },
    "Payment prompt shown to user"
  );
}
