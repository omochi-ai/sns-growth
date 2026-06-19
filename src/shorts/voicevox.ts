const VOICEVOX_URL = process.env.VOICEVOX_URL ?? "http://127.0.0.1:50021";
const DEFAULT_SPEAKER = Number(process.env.VOICEVOX_SPEAKER ?? "3");

export async function isVoicevoxAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${VOICEVOX_URL}/version`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function synthesizeSpeech(
  text: string,
  speaker: number = DEFAULT_SPEAKER
): Promise<ArrayBuffer> {
  const queryRes = await fetch(
    `${VOICEVOX_URL}/audio_query?${new URLSearchParams({ text, speaker: String(speaker) })}`,
    { method: "POST" }
  );
  if (!queryRes.ok) {
    throw new Error(`VOICEVOX audio_query failed: ${queryRes.status}`);
  }
  const query = await queryRes.json();

  const synthRes = await fetch(
    `${VOICEVOX_URL}/synthesis?${new URLSearchParams({ speaker: String(speaker) })}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    }
  );
  if (!synthRes.ok) {
    throw new Error(`VOICEVOX synthesis failed: ${synthRes.status}`);
  }
  return synthRes.arrayBuffer();
}

export function truncateForShorts(text: string, maxChars = 180): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return normalized.slice(0, maxChars - 1) + "…";
}
