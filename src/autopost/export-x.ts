import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DateTime } from "luxon";
import { loadConfig, parseScheduleAt } from "./config.js";
import { loadPosts } from "./posts.js";
import type { Post } from "./types.js";

export type ExportFormat = "csv" | "txt";

export interface ExportXOptions {
  outputPath?: string;
  format?: ExportFormat;
  includeUsed?: boolean;
  config?: ReturnType<typeof loadConfig>;
}

function formatForScheduler(post: Post, timezone: string): string {
  const dt = parseScheduleAt(post.scheduleAt, timezone);
  return dt.toFormat("yyyy-MM-dd HH:mm");
}

function toCsvRow(post: Post, timezone: string): string {
  const scheduled = formatForScheduler(post, timezone);
  const text = post.text.replace(/"/g, '""').replace(/\r?\n/g, " ");
  return `"${post.id}","${scheduled}","${text}"`;
}

export function exportXPosts(options: ExportXOptions = {}): {
  path: string;
  count: number;
} {
  const config = options.config ?? loadConfig();
  const format = options.format ?? "csv";
  const includeUsed = options.includeUsed ?? false;
  const defaultName =
    format === "csv"
      ? "exports/x-scheduler.csv"
      : "exports/x-scheduler.txt";
  const outputPath = options.outputPath ?? defaultName;

  let posts = loadPosts(config.postsPath).filter((p) => p.platform === "x");
  if (!includeUsed) {
    posts = posts.filter((p) => !p.used);
  }
  posts.sort(
    (a, b) =>
      parseScheduleAt(a.scheduleAt, config.timezone).toMillis() -
      parseScheduleAt(b.scheduleAt, config.timezone).toMillis()
  );

  mkdirSync(dirname(outputPath), { recursive: true });

  if (format === "csv") {
    const header = "id,scheduled_at_jst,text";
    const rows = posts.map((p) => toCsvRow(p, config.timezone));
    writeFileSync(outputPath, [header, ...rows].join("\n") + "\n", "utf-8");
  } else {
    const blocks = posts.map((p) => {
      const scheduled = formatForScheduler(p, config.timezone);
      return [
        `--- ${p.id} @ ${scheduled} JST ---`,
        p.text,
        "",
      ].join("\n");
    });
    const header = [
      "# X スケジューラ取込用エクスポート（D-002: API実投稿は無効）",
      `# 生成: ${DateTime.now().setZone(config.timezone).toISO()}`,
      `# 件数: ${posts.length}`,
      "# Typefully / Buffer 等に手動またはCSV取込で登録してください。",
      "",
    ].join("\n");
    writeFileSync(outputPath, header + blocks.join("\n"), "utf-8");
  }

  return { path: outputPath, count: posts.length };
}
