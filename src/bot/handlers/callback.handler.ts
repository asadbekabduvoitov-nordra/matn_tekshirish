import type { BotContext } from "../../types/index.js";

export async function handleMatnTekshirishCallback(
  ctx: BotContext
): Promise<void> {
  await ctx.answerCbQuery();
  await ctx.scene.enter("matn_tekshirish");
}
