import { Scenes } from "telegraf";
import type { BotContext } from "../../types/index.js";
import { exampleScene } from "./example.scene.js";
import { matnTekshirishScene } from "./matn-tekshirish.scene.js";

export function createStage(): Scenes.Stage<BotContext> {
  return new Scenes.Stage<BotContext>([exampleScene, matnTekshirishScene]);
}

export { exampleScene, matnTekshirishScene };
