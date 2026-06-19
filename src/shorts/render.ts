import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function isFfmpegAvailable(): boolean {
  const result = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf-8",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}

export function createSilentAudio(path: string, durationSec = 20): void {
  mkdirSync(dirname(path), { recursive: true });
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=mono",
      "-t",
      String(durationSec),
      "-q:a",
      "9",
      "-acodec",
      "libmp3lame",
      path,
    ],
    { encoding: "utf-8", shell: process.platform === "win32" }
  );
  if (result.status !== 0) {
    throw new Error(`silent audio generation failed: ${result.stderr}`);
  }
}

export interface RenderOptions {
  audioPath: string;
  text: string;
  outputPath: string;
  width?: number;
  height?: number;
}

function wrapText(text: string, maxCharsPerLine = 16): string[] {
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      break;
    }
    let breakAt = maxCharsPerLine;
    const slice = remaining.slice(0, maxCharsPerLine + 1);
    const lastPunct = Math.max(
      slice.lastIndexOf("。"),
      slice.lastIndexOf("、"),
      slice.lastIndexOf(" ")
    );
    if (lastPunct > 4) breakAt = lastPunct + 1;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  return lines.slice(0, 8);
}

function buildDrawtextFilter(lines: string[], durationSec: number): string {
  const lineDuration = durationSec / Math.max(lines.length, 1);
  const filters: string[] = [];

  lines.forEach((line, i) => {
    const start = i * lineDuration;
    const end = (i + 1) * lineDuration;
    const escaped = line
      .replace(/\\/g, "\\\\")
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/%/g, "\\%");
    filters.push(
      `drawtext=fontfile='C\\:/Windows/Fonts/meiryo.ttc':text='${escaped}':fontsize=52:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${start.toFixed(2)},${end.toFixed(2)})'`
    );
  });

  return filters.join(",");
}

function buildDrawtextFilterFallback(lines: string[], durationSec: number): string {
  const text = lines.join("\\n");
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "\\'")
    .replace(/%/g, "\\%");
  return `drawtext=text='${escaped}':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`;
}

export function getAudioDurationSec(audioPath: string): number {
  const result = spawnSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      audioPath,
    ],
    { encoding: "utf-8", shell: process.platform === "win32" }
  );
  if (result.status !== 0) {
    return 20;
  }
  const sec = parseFloat(result.stdout.trim());
  return Number.isFinite(sec) ? Math.min(Math.max(sec, 15), 30) : 20;
}

export function renderShortVideo(options: RenderOptions): void {
  const width = options.width ?? 1080;
  const height = options.height ?? 1920;
  mkdirSync(dirname(options.outputPath), { recursive: true });

  const duration = getAudioDurationSec(options.audioPath);
  const lines = wrapText(options.text);
  let drawtext = buildDrawtextFilter(lines, duration);

  const args = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x1a1a2e:s=${width}x${height}:d=${duration}`,
    "-i",
    options.audioPath,
    "-vf",
    drawtext,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-shortest",
    options.outputPath,
  ];

  let result = spawnSync("ffmpeg", args, {
    encoding: "utf-8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    drawtext = buildDrawtextFilterFallback(lines, duration);
    result = spawnSync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x1a1a2e:s=${width}x${height}:d=${duration}`,
        "-i",
        options.audioPath,
        "-vf",
        drawtext,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-shortest",
        options.outputPath,
      ],
      { encoding: "utf-8", shell: process.platform === "win32" }
    );
  }

  if (result.status !== 0) {
    throw new Error(
      `ffmpeg failed:\n${result.stderr ?? result.stdout ?? "unknown error"}`
    );
  }
}

export function writeWav(buffer: ArrayBuffer, path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(buffer));
}

export function readTextFromFile(path: string): string {
  return readFileSync(path, "utf-8").trim();
}

export function defaultOutputPath(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join("output", "shorts", `short-${stamp}.mp4`);
}
