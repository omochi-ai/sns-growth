import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { Post } from "./types.js";

export function loadPosts(filePath: string): Post[] {
  if (!existsSync(filePath)) {
    return [];
  }
  const raw = readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as Post[];
  if (!Array.isArray(data)) {
    throw new Error(`${filePath} must contain a JSON array`);
  }
  return data;
}

export function savePosts(filePath: string, posts: Post[]): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(posts, null, 2) + "\n", "utf-8");
}

export function findPost(posts: Post[], id: string): Post | undefined {
  return posts.find((p) => p.id === id);
}

export function markPostUsed(
  posts: Post[],
  id: string,
  postedId: string
): Post[] {
  return posts.map((p) =>
    p.id === id ? { ...p, used: true, postedId } : p
  );
}
