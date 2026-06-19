#!/usr/bin/env node
import { Command } from "commander";
import { importFromMarkdown } from "./autopost/import-md.js";
import { exportXPosts } from "./autopost/export-x.js";
import { generatePosts } from "./autopost/generate.js";
import { runAutopost } from "./autopost/runner.js";
import { generateShort } from "./shorts/pipeline.js";
import { buildLinkPage } from "./linkpage/build.js";

const program = new Command();

program
  .name("autopost")
  .description("SNS自動投稿システム（Threads先行 / Xはエクスポートのみ）");

program
  .command("run")
  .description("予定時刻を過ぎた未投稿を処理（Threads API / Xはスキップ）")
  .option("--dry-run", "実投稿せずログのみ出力", false)
  .action(async (opts: { dryRun: boolean }) => {
    await runAutopost({ dryRun: opts.dryRun });
  });

program
  .command("import")
  .description("content/threads-x-posts.md を data/posts.json に変換")
  .option("-i, --input <path>", "入力Markdown", "content/threads-x-posts.md")
  .option("--threads-only", "Threadsのみ（platform=x を除外）")
  .option("--merge", "既存 posts.json に追記（ID重複は除外）")
  .action((opts: { input: string; threadsOnly?: boolean; merge?: boolean }) => {
    const platforms = opts.threadsOnly
      ? (["threads"] as const)
      : (["threads", "x"] as const);
    const posts = importFromMarkdown({
      mdPath: opts.input,
      platforms: [...platforms],
      merge: opts.merge,
    });
    console.log(`[import] ${posts.length} 件を data/posts.json に保存しました`);
  });

program
  .command("generate")
  .description("Claude APIで投稿文を生成し posts.json に追記（T-002）")
  .option("-t, --theme-file <path>", "テーマファイル", "data/themes.txt")
  .option("-c, --count <n>", "生成件数", "30")
  .option("--threads-only", "Threadsのみ")
  .option("--dry-run", "API呼び出しせずプロンプトのみ表示")
  .action(
    async (opts: {
      themeFile: string;
      count: string;
      threadsOnly?: boolean;
      dryRun?: boolean;
    }) => {
      const platforms = opts.threadsOnly
        ? (["threads"] as const)
        : (["threads", "x"] as const);
      await generatePosts({
        themeFile: opts.themeFile,
        count: Number(opts.count),
        platforms: [...platforms],
        dryRun: opts.dryRun,
      });
    }
  );

program
  .command("export-x")
  .description("X用スケジューラ取込ファイルを出力（D-002: API実投稿なし）")
  .option("-o, --output <path>", "出力パス")
  .option("-f, --format <format>", "csv または txt", "csv")
  .option("--include-used", "投稿済みも含める")
  .action(
    (opts: {
      output?: string;
      format: string;
      includeUsed?: boolean;
    }) => {
      const format = opts.format === "txt" ? "txt" : "csv";
      const result = exportXPosts({
        outputPath: opts.output,
        format,
        includeUsed: opts.includeUsed,
      });
      console.log(
        `[export-x] ${result.count} 件を ${result.path} に出力しました`
      );
    }
  );

program
  .command("shorts")
  .description("投稿テキストから縦型Shorts mp4を生成（VOICEVOX+ffmpeg、T-003 PoC）")
  .option("--text <text>", "ナレーション原稿")
  .option("--text-file <path>", "原稿ファイル")
  .option("-o, --output <path>", "出力mp4パス")
  .option("--dry-run", "VOICEVOXをスキップしffmpegレンダリングのみ確認")
  .action(
    async (opts: {
      text?: string;
      textFile?: string;
      output?: string;
      dryRun?: boolean;
    }) => {
      await generateShort({
        text: opts.text,
        textFile: opts.textFile,
        output: opts.output,
        dryRun: opts.dryRun,
      });
    }
  );

program
  .command("build-linkpage")
  .description("リンク集約ページを docs/index.html に生成（GitHub Pages用、T-004）")
  .option("-c, --config <path>", "設定JSON", "linkpage/config.json")
  .option("-o, --output <path>", "出力HTML", "docs/index.html")
  .action((opts: { config: string; output: string }) => {
    const out = buildLinkPage({ configPath: opts.config, outputPath: opts.output });
    console.log(`[linkpage] ${out} を生成しました`);
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
