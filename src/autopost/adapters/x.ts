import type { PlatformAdapter, PostResult } from "../types.js";

/**
 * X (Twitter) adapter — interface only.
 * Per D-002: X API posting is disabled (paid tier). Use `export-x` for scheduler import.
 */
export class XAdapter implements PlatformAdapter {
  readonly platform = "x" as const;

  async post(_text: string, _dryRun: boolean): Promise<PostResult> {
    return {
      success: false,
      error:
        "X API実投稿は無効です（D-002: 無料運用）。`npm run autopost -- export-x` でスケジューラ取込用CSV/テキストを出力してください。",
    };
  }
}

export class XAdapterDisabledError extends Error {
  constructor() {
    super(
      "X API posting is disabled per D-002. Use export-x command instead."
    );
    this.name = "XAdapterDisabledError";
  }
}
