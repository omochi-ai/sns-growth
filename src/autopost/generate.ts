import { readFileSync, existsSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { DateTime } from "luxon";
import { loadConfig, parseScheduleAt } from "./config.js";
import { loadPosts, savePosts } from "./posts.js";
import type { Platform, Post } from "./types.js";

export interface GenerateOptions {
  themeFile?: string;
  count?: number;
  platforms?: Platform[];
  noteAuditPath?: string;
  dryRun?: boolean;
}

interface GeneratedItem {
  type: "knowhow" | "story" | "cta";
  text: string;
  theme?: string;
}

const NOTE_TOPICS = [
  "請求書自動作成",
  "フォーム回答整理",
  "スプシ集計",
  "問い合わせAI仕分け",
  "予約受付",
  "毎日のコピペ自動化",
  "Excel定期更新",
  "スクレイピング合法ライン",
  "自動化と外注の切り分け",
  "Claude初心者向け環境構築",
];

function loadThemes(path: string): string[] {
  if (!existsSync(path)) {
    throw new Error(`Theme file not found: ${path}`);
  }
  return readFileSync(path, "utf-8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function loadNoteContext(path: string): string {
  if (!existsSync(path)) {
    return NOTE_TOPICS.join(" / ");
  }
  return readFileSync(path, "utf-8").slice(0, 4000);
}

function ratioBreakdown(count: number): {
  knowhow: number;
  story: number;
  cta: number;
} {
  const cta = Math.max(1, Math.round(count / 10));
  const story = Math.max(1, Math.round(count / 10));
  const knowhow = count - cta - story;
  return { knowhow, story, cta };
}

function buildPrompt(
  themes: string[],
  count: number,
  noteContext: string
): string {
  const ratio = ratioBreakdown(count);
  const selectedThemes = themes.slice(0, Math.min(themes.length, count));

  return `あなたはSNS投稿ライターです。以下の条件でThreads/X向けの短い投稿文を生成してください。

## ペルソナ
事務作業に追われるひとり社長・個人事業主（AI初心者）

## 比率（厳守）
- ノウハウ型: ${ratio.knowhow}本（保存される実用Tips）
- 実績・ストーリー型: ${ratio.story}本
- 誘導型: ${ratio.cta}本（無料特典/入口980円/本命3980円テンプレパックへ自然誘導）

## 文体ルール
- 1投稿1メッセージ
- 絵文字は控えめ（0〜1個まで）
- 煽らない・誇張しない
- 具体的な手順・コピペ例・Before/Afterが望ましい
- 各投稿は280〜450文字程度（Threads 500字以内）

## ネタ元（note記事・商品ラダー）
${noteContext}

## テーマ候補
${selectedThemes.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## 出力形式
JSON配列のみを返してください（説明文不要）:
[
  { "type": "knowhow", "text": "投稿本文", "theme": "元テーマ" },
  { "type": "story", "text": "...", "theme": "..." },
  { "type": "cta", "text": "...", "theme": "..." }
]

合計 ${count} 件。type の件数比率を厳守してください。`;
}

function parseGeneratedJson(raw: string): GeneratedItem[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Claude response did not contain a JSON array");
  }
  const parsed = JSON.parse(jsonMatch[0]) as GeneratedItem[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Generated JSON array is empty");
  }
  return parsed;
}

function lastScheduledAt(posts: Post[], timezone: string): DateTime | undefined {
  if (posts.length === 0) return undefined;
  let max = parseScheduleAt(posts[0].scheduleAt, timezone);
  for (const p of posts) {
    const dt = parseScheduleAt(p.scheduleAt, timezone);
    if (dt > max) max = dt;
  }
  return max;
}

function buildScheduleSlots(
  count: number,
  config: ReturnType<typeof loadConfig>,
  after?: DateTime
): DateTime[] {
  const slots: DateTime[] = [];
  let day = after
    ? after.plus({ days: 1 }).startOf("day")
    : DateTime.now().setZone(config.timezone).startOf("day");

  if (!after) {
    const now = DateTime.now().setZone(config.timezone);
    const todaySlots = config.postTimes.map((time) => {
      const [h, m] = time.split(":").map(Number);
      return day.set({ hour: h, minute: m, second: 0, millisecond: 0 });
    });
    const remaining = todaySlots.filter((s) => s > now);
    for (const s of remaining) {
      if (slots.length >= count) break;
      slots.push(s);
    }
    if (slots.length < count) {
      day = day.plus({ days: 1 });
    }
  }

  while (slots.length < count) {
    for (const time of config.postTimes) {
      if (slots.length >= count) break;
      const [h, m] = time.split(":").map(Number);
      slots.push(day.set({ hour: h, minute: m, second: 0, millisecond: 0 }));
    }
    day = day.plus({ days: 1 });
  }
  return slots;
}

function toPosts(
  items: GeneratedItem[],
  config: ReturnType<typeof loadConfig>,
  platforms: Platform[],
  startAfter?: DateTime
): Post[] {
  const slotCount = items.length * platforms.length;
  const schedules = buildScheduleSlots(slotCount, config, startAfter);
  const posts: Post[] = [];
  const batchId = DateTime.now().toFormat("yyyyMMdd-HHmm");
  let slotIndex = 0;

  items.forEach((item, idx) => {
    const label = `G-${batchId}-${String(idx + 1).padStart(2, "0")}`;
    for (const platform of platforms) {
      posts.push({
        id: `${label}-${platform}`,
        text: item.text.trim(),
        platform,
        scheduleAt:
          schedules[slotIndex].toISO() ?? schedules[slotIndex].toString(),
        used: false,
        postedId: null,
      });
      slotIndex++;
    }
  });

  return posts;
}

export async function generatePosts(
  options: GenerateOptions = {}
): Promise<{ generated: number; appended: number; posts: Post[] }> {
  const config = loadConfig();
  const themeFile = options.themeFile ?? "data/themes.txt";
  const count = options.count ?? 30;
  const platforms = options.platforms ?? ["threads", "x"];
  const noteAuditPath = options.noteAuditPath ?? "data/note-audit.md";
  const dryRun = options.dryRun ?? false;

  const themes = loadThemes(themeFile);
  const noteContext = loadNoteContext(noteAuditPath);
  const prompt = buildPrompt(themes, count, noteContext);

  if (dryRun) {
    console.log("[generate] [DRY-RUN] Prompt preview:\n");
    console.log(prompt.slice(0, 800) + "...\n");
    return { generated: 0, appended: 0, posts: [] };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY が未設定です。.env に設定してください（API呼び出し＝従量課金）。"
    );
  }

  const model = process.env.CLAUDE_MODEL ?? "claude-opus-4-8";
  const client = new Anthropic({ apiKey });

  console.log(`[generate] Claude API (${model}) で ${count} 件生成中...`);

  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const items = parseGeneratedJson(textBlock.text);
  const existing = loadPosts(config.postsPath);
  const startAfter = lastScheduledAt(existing, config.timezone);
  const newPosts = toPosts(items, config, platforms, startAfter);
  const merged = [...existing, ...newPosts];
  savePosts(config.postsPath, merged);

  console.log(
    `[generate] ${items.length} 件生成 → posts.json に ${newPosts.length} エントリ追記（合計 ${merged.length}）`
  );

  return {
    generated: items.length,
    appended: newPosts.length,
    posts: newPosts,
  };
}
