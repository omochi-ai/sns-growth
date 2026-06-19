import { appendFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { DateTime } from "luxon";

const CSV_HEADER = "timestamp,platform,success,postId,postedId,message\n";

export interface LogEntry {
  platform: string;
  success: boolean;
  postId: string;
  postedId?: string;
  message?: string;
}

export function appendPostLog(logPath: string, entry: LogEntry): void {
  mkdirSync(dirname(logPath), { recursive: true });
  if (!existsSync(logPath)) {
    appendFileSync(logPath, CSV_HEADER, "utf-8");
  }
  const timestamp = DateTime.now().toISO() ?? new Date().toISOString();
  const row = [
    timestamp,
    entry.platform,
    entry.success ? "true" : "false",
    entry.postId,
    entry.postedId ?? "",
    escapeCsv(entry.message ?? ""),
  ].join(",");
  appendFileSync(logPath, row + "\n", "utf-8");
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function countPostedToday(
  logPath: string,
  platform: string,
  timezone: string
): number {
  if (!existsSync(logPath)) {
    return 0;
  }
  const lines = readFileSync(logPath, "utf-8").trim().split("\n");
  const today = DateTime.now().setZone(timezone).toISODate();
  let count = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const [timestamp, plat, success] = parseCsvLine(line);
    if (plat !== platform || success !== "true") continue;
    const date = DateTime.fromISO(timestamp).setZone(timezone).toISODate();
    if (date === today) count++;
  }
  return count;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
