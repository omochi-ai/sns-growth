import type { Platform } from "../types.js";
import { ThreadsAdapter } from "./threads.js";
import { XAdapter } from "./x.js";
import type { AppConfig } from "../config.js";
import type { PlatformAdapter } from "../types.js";

export function createAdapter(
  platform: Platform,
  config: AppConfig
): PlatformAdapter {
  switch (platform) {
    case "threads":
      return new ThreadsAdapter(config.threadsUserId, config.threadsAccessToken);
    case "x":
      return new XAdapter();
    default: {
      const _exhaustive: never = platform;
      throw new Error(`Unknown platform: ${_exhaustive}`);
    }
  }
}
