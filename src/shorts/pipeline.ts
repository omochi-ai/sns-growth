import { join } from "node:path";
import {
  createSilentAudio,
  defaultOutputPath,
  isFfmpegAvailable,
  readTextFromFile,
  renderShortVideo,
  writeWav,
} from "./render.js";
import {
  isVoicevoxAvailable,
  synthesizeSpeech,
  truncateForShorts,
} from "./voicevox.js";

export interface ShortsOptions {
  text?: string;
  textFile?: string;
  output?: string;
  workDir?: string;
  dryRun?: boolean;
}

export async function generateShort(options: ShortsOptions): Promise<string> {
  const rawText =
    options.text ??
    (options.textFile ? readTextFromFile(options.textFile) : undefined);

  if (!rawText) {
    throw new Error("--text または --text-file を指定してください");
  }

  const text = truncateForShorts(rawText);
  const workDir = options.workDir ?? join("output", "shorts", "work");
  const outputPath = options.output ?? defaultOutputPath();
  const audioPath = join(workDir, options.dryRun ? "silent.mp3" : "narration.wav");

  if (!isFfmpegAvailable()) {
    throw new Error(
      "ffmpeg が見つかりません。PATH に ffmpeg / ffprobe を追加してください。"
    );
  }

  if (options.dryRun) {
    console.log("[shorts] [DRY-RUN] VOICEVOXをスキップし無音トラックでレンダリング");
    createSilentAudio(audioPath, 20);
  } else {
    if (!(await isVoicevoxAvailable())) {
      throw new Error(
        "VOICEVOX が起動していません。https://voicevox.hiroshiba.jp/ をインストールし、エンジンを起動してください（既定: http://127.0.0.1:50021）。"
      );
    }
    console.log("[shorts] VOICEVOX で音声合成中...");
    const audio = await synthesizeSpeech(text);
    writeWav(audio, audioPath);
  }

  console.log("[shorts] ffmpeg で動画レンダリング中...");
  renderShortVideo({ audioPath, text, outputPath });

  console.log(`[shorts] 完了: ${outputPath}`);
  return outputPath;
}
