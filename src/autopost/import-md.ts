import { readFileSync } from "node:fs";
import { DateTime } from "luxon";
import type { AppConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { loadPosts, savePosts } from "./posts.js";
import type { Platform, Post } from "./types.js";

interface ParsedEntry {
  label: string;
  text: string;
  category: "knowhow" | "story" | "cta";
}

const HEADING_RE = /^###\s+([A-Z]-\d+)\s*$/;

export function parseMarkdownPosts(content: string): ParsedEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: ParsedEntry[] = [];
  let currentLabel: string | null = null;
  let currentLines: string[] = [];
  let currentCategory: ParsedEntry["category"] = "knowhow";

  function flush(): void {
    if (!currentLabel) return;
    const text = currentLines.join("\n").trim();
    if (text) {
      entries.push({
        label: currentLabel,
        text,
        category: currentCategory,
      });
    }
    currentLines = [];
  }

  for (const line of lines) {
    if (line.startsWith("## ノウハウ")) {
      flush();
      currentLabel = null;
      currentCategory = "knowhow";
      continue;
    }
    if (line.startsWith("## 実績")) {
      flush();
      currentLabel = null;
      currentCategory = "story";
      continue;
    }
    if (line.startsWith("## 誘導")) {
      flush();
      currentLabel = null;
      currentCategory = "cta";
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      flush();
      currentLabel = heading[1];
      continue;
    }

    if (currentLabel) {
      currentLines.push(line);
    }
  }
  flush();
  return entries;
}

function nextScheduleSlots(
  count: number,
  config: AppConfig,
  startFrom?: DateTime
): DateTime[] {
  const slots: DateTime[] = [];
  let cursor =
    startFrom ??
    DateTime.now().setZone(config.timezone).startOf("day");

  if (!startFrom && DateTime.now().setZone(config.timezone) > cursor) {
    // If we're past today's slots, start tomorrow
    const todaySlots = buildDaySlots(cursor, config);
    const now = DateTime.now().setZone(config.timezone);
    const remainingToday = todaySlots.filter((s) => s > now);
    if (remainingToday.length > 0) {
      for (const s of remainingToday) {
        if (slots.length >= count) break;
        slots.push(s);
      }
      cursor = cursor.plus({ days: 1 });
    } else {
      cursor = cursor.plus({ days: 1 });
    }
  }

  while (slots.length < count) {
    const daySlots = buildDaySlots(cursor, config);
    for (const s of daySlots) {
      if (slots.length >= count) break;
      slots.push(s);
    }
    cursor = cursor.plus({ days: 1 });
  }

  return slots;
}

function buildDaySlots(day: DateTime, config: AppConfig): DateTime[] {
  return config.postTimes.map((time) => {
    const [hour, minute] = time.split(":").map(Number);
    return day.set({ hour, minute, second: 0, millisecond: 0 });
  });
}

export interface ImportOptions {
  mdPath?: string;
  platforms?: Platform[];
  config?: AppConfig;
  merge?: boolean;
}

export function importFromMarkdown(options: ImportOptions = {}): Post[] {
  const config = options.config ?? loadConfig();
  const mdPath = options.mdPath ?? "content/threads-x-posts.md";
  const platforms = options.platforms ?? ["threads", "x"];
  const content = readFileSync(mdPath, "utf-8");
  const parsed = parseMarkdownPosts(content);

  const slotCount = parsed.length * platforms.length;
  const schedules = nextScheduleSlots(slotCount, config);

  const posts: Post[] = [];
  let slotIndex = 0;

  for (const entry of parsed) {
    for (const platform of platforms) {
      posts.push({
        id: `${entry.label}-${platform}`,
        text: entry.text,
        platform,
        scheduleAt: schedules[slotIndex].toISO() ?? schedules[slotIndex].toString(),
        used: false,
        postedId: null,
      });
      slotIndex++;
    }
  }

  if (options.merge) {
    const existing = loadPosts(config.postsPath);
    const existingIds = new Set(existing.map((p) => p.id));
    const merged = [
      ...existing,
      ...posts.filter((p) => !existingIds.has(p.id)),
    ];
    savePosts(config.postsPath, merged);
    return merged;
  }

  savePosts(config.postsPath, posts);
  return posts;
}
