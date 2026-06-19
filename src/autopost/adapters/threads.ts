import type { PlatformAdapter, PostResult } from "../types.js";
import { publishTextPost, ThreadsApiError } from "../threads-api.js";

export class ThreadsAdapter implements PlatformAdapter {
  readonly platform = "threads" as const;

  constructor(
    private readonly userId: string,
    private readonly accessToken: string
  ) {}

  async post(text: string, dryRun: boolean): Promise<PostResult> {
    if (dryRun) {
      return {
        success: true,
        dryRun: true,
        postedId: `dry-run-${Date.now()}`,
      };
    }

    if (!this.userId || !this.accessToken) {
      return {
        success: false,
        error:
          "THREADS_USER_ID / THREADS_ACCESS_TOKEN が未設定です。.env を確認してください。",
      };
    }

    if (text.length > 500) {
      return {
        success: false,
        error: `Threads投稿は500文字以内です（現在 ${text.length} 文字）`,
      };
    }

    try {
      const postedId = await publishTextPost(
        this.userId,
        this.accessToken,
        text
      );
      return { success: true, postedId };
    } catch (err) {
      const message =
        err instanceof ThreadsApiError
          ? `${err.message}: ${JSON.stringify(err.body)}`
          : err instanceof Error
            ? err.message
            : String(err);
      return { success: false, error: message };
    }
  }
}
