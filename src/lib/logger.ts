import pino from "pino";
import { env, isDev } from "../config/index.js";

export const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export const createChildLogger = (name: string) => {
  return logger.child({ module: name });
};
