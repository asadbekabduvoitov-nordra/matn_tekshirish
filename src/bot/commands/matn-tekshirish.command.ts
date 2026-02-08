import type { BotContext } from "../../types/index.js";

export async function matnTekshirishCommand(ctx: BotContext): Promise<void> {
  await ctx.scene.enter("matn_tekshirish");
}
