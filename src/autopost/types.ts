export type Platform = "threads" | "x";

export interface Post {
  id: string;
  text: string;
  platform: Platform;
  scheduleAt: string;
  used: boolean;
  postedId: string | null;
}

export interface PostResult {
  success: boolean;
  postedId?: string;
  error?: string;
  dryRun?: boolean;
}

export interface PlatformAdapter {
  readonly platform: Platform;
  post(text: string, dryRun: boolean): Promise<PostResult>;
}
