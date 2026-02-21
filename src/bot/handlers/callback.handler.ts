import { matnTekshirishCommand } from "../commands/matn-tekshirish.command.js";
import { env } from "../../config/index.js";
import type { BotContext } from "../../types/index.js";

export async function handleMatnTekshirishCallback(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();
  await matnTekshirishCommand(ctx);
}

export async function handleCheckSubscriptionCallback(
  ctx: BotContext
): Promise<void> {
  if (!ctx.from || !ctx.callbackQuery) {
    await ctx.answerCbQuery("Xatolik yuz berdi");
    return;
  }

  try {
    const chatMember = await ctx.telegram.getChatMember(
      env.REQUIRED_CHANNEL,
      ctx.from.id
    );

    const validStatuses = ["creator", "administrator", "member"];

    if (validStatuses.includes(chatMember.status)) {
      // Answer the callback query to remove loading state
      await ctx.answerCbQuery("✅ Obuna tasdiqlandi!");

      // Delete the old message with buttons
      if ("message" in ctx.callbackQuery) {
        try {
          await ctx.deleteMessage();
        } catch (deleteError) {
          console.log("Could not delete message:", deleteError);
        }
      }

      // Import and call start command directly instead of asking user to type it
      const { startCommand } = await import("../commands/start.command.js");
      await startCommand(ctx);
    } else {
      // Show alert that they're not subscribed yet
      await ctx.answerCbQuery("❌ Siz hali obuna bo'lmagansiz", {
        show_alert: true,
      });
    }
  } catch (error) {
    console.error("Error checking subscription:", error);
    await ctx.answerCbQuery("Xatolik yuz berdi");
  }
}
