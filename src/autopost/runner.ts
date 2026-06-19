import { DateTime } from "luxon";
import type { AppConfig } from "./config.js";
import { loadConfig, nowInTimezone, parseScheduleAt } from "./config.js";
import { createAdapter } from "./adapters/index.js";
import { appendPostLog, countPostedToday } from "./logger.js";
import { loadPosts, markPostUsed, savePosts } from "./posts.js";
import type { Platform, Post } from "./types.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export interface RunOptions {
  dryRun?: boolean;
  config?: AppConfig;
}

export interface RunSummary {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function selectDuePosts(
  posts: Post[],
  config: AppConfig
): Post[] {
  const now = nowInTimezone(config.timezone);
  const due = posts.filter((p) => {
    if (p.used) return false;
    const scheduled = parseScheduleAt(p.scheduleAt, config.timezone);
    return scheduled <= now;
  });

  due.sort(
    (a, b) =>
      parseScheduleAt(a.scheduleAt, config.timezone).toMillis() -
      parseScheduleAt(b.scheduleAt, config.timezone).toMillis()
  );

  const postedTodayByPlatform = new Map<Platform, number>();
  for (const platform of ["threads", "x"] as Platform[]) {
    postedTodayByPlatform.set(
      platform,
      countPostedToday(config.logPath, platform, config.timezone)
    );
  }

  const selected: Post[] = [];
  const batchCountByPlatform = new Map<Platform, number>();

  for (const post of due) {
    const alreadyPosted = postedTodayByPlatform.get(post.platform) ?? 0;
    const inBatch = batchCountByPlatform.get(post.platform) ?? 0;
    const limit = config.dailyLimitPerPlatform - alreadyPosted - inBatch;

    if (limit <= 0) {
      continue;
    }

    selected.push(post);
    batchCountByPlatform.set(post.platform, inBatch + 1);
  }

  return selected;
}

async function postWithRetry(
  post: Post,
  dryRun: boolean,
  config: AppConfig
): Promise<{ success: boolean; postedId?: string; error?: string }> {
  const adapter = createAdapter(post.platform, config);

  // X API is disabled per D-002 — no point retrying
  if (post.platform === "x") {
    const result = await adapter.post(post.text, dryRun);
    if (result.success) {
      return { success: true, postedId: result.postedId };
    }
    return { success: false, error: result.error };
  }

  let lastError = "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = await adapter.post(post.text, dryRun);
    if (result.success) {
      return { success: true, postedId: result.postedId };
    }
    lastError = result.error ?? "Unknown error";
    if (attempt < MAX_RETRIES) {
      console.warn(
        `[retry ${attempt}/${MAX_RETRIES}] ${post.id} (${post.platform}): ${lastError}`
      );
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  return { success: false, error: lastError };
}

export async function runAutopost(options: RunOptions = {}): Promise<RunSummary> {
  const config = options.config ?? loadConfig();
  const dryRun = options.dryRun ?? false;
  let posts = loadPosts(config.postsPath);
  const due = selectDuePosts(posts, config);

  const summary: RunSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  if (due.length === 0) {
    console.log(
      `[autopost] 投稿対象なし (${DateTime.now().setZone(config.timezone).toISO()})`
    );
    return summary;
  }

  console.log(
    `[autopost] ${dryRun ? "[DRY-RUN] " : ""}${due.length} 件を処理します`
  );

  for (const post of due) {
    summary.processed++;
    const prefix = dryRun ? "[DRY-RUN] " : "";
    console.log(
      `${prefix}[${post.platform}] ${post.id} @ ${post.scheduleAt}`
    );

    const result = await postWithRetry(post, dryRun, config);

    if (result.success && result.postedId) {
      summary.succeeded++;
      if (!dryRun) {
        posts = markPostUsed(posts, post.id, result.postedId);
        savePosts(config.postsPath, posts);
      }
      appendPostLog(config.logPath, {
        platform: post.platform,
        success: true,
        postId: post.id,
        postedId: result.postedId,
        message: dryRun ? "dry-run" : undefined,
      });
      console.log(`  ✓ 成功 postedId=${result.postedId}`);
    } else if (post.platform === "x") {
      summary.skipped++;
      appendPostLog(config.logPath, {
        platform: post.platform,
        success: false,
        postId: post.id,
        message: result.error,
      });
      console.log(`  ⊘ スキップ: ${result.error}`);
    } else {
      summary.failed++;
      appendPostLog(config.logPath, {
        platform: post.platform,
        success: false,
        postId: post.id,
        message: result.error,
      });
      console.log(`  ✗ 失敗: ${result.error}`);
    }
  }

  console.log(
    `[autopost] 完了: 成功=${summary.succeeded} 失敗=${summary.failed} スキップ=${summary.skipped}`
  );
  return summary;
}
