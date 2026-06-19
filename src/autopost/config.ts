import { config as loadDotenv } from "dotenv";
import { DateTime } from "luxon";

loadDotenv();

export interface AppConfig {
  postTimes: string[];
  timezone: string;
  dailyLimitPerPlatform: number;
  threadsUserId: string;
  threadsAccessToken: string;
  postsPath: string;
  logPath: string;
}

function parsePostTimes(raw: string | undefined): string[] {
  const value = raw ?? "07:00,12:00,20:00";
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

export function loadConfig(overrides?: Partial<AppConfig>): AppConfig {
  return {
    postTimes: parsePostTimes(process.env.POST_TIMES),
    timezone: process.env.TIMEZONE ?? "Asia/Tokyo",
    dailyLimitPerPlatform: Number(process.env.DAILY_LIMIT_PER_PLATFORM ?? "3"),
    threadsUserId: process.env.THREADS_USER_ID ?? "",
    threadsAccessToken: process.env.THREADS_ACCESS_TOKEN ?? "",
    postsPath: "data/posts.json",
    logPath: "logs/post-log.csv",
    ...overrides,
  };
}

export function nowInTimezone(timezone: string): DateTime {
  return DateTime.now().setZone(timezone);
}

export function parseScheduleAt(iso: string, timezone: string): DateTime {
  return DateTime.fromISO(iso, { setZone: true }).setZone(timezone);
}
