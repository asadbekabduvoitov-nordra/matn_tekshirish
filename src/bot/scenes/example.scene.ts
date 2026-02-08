import { Scenes } from "telegraf";
import type { BotContext } from "../../types/index.js";

export const exampleScene = new Scenes.BaseScene<BotContext>("example");

exampleScene.enter(async (ctx) => {
  await ctx.reply("You entered the example scene. Type something or /leave to exit.");
});

exampleScene.command("leave", async (ctx) => {
  await ctx.reply("Leaving the scene...");
  await ctx.scene.leave();
});

exampleScene.on("text", async (ctx) => {
  await ctx.reply(`Scene received: ${ctx.message.text}`);
});
