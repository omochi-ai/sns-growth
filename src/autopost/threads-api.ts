const THREADS_API = "https://graph.threads.net/v1.0";

export class ThreadsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ThreadsApiError";
  }
}

export async function publishTextPost(
  userId: string,
  accessToken: string,
  text: string
): Promise<string> {
  const params = new URLSearchParams({
    media_type: "TEXT",
    text,
    auto_publish_text: "true",
    access_token: accessToken,
  });

  const url = `${THREADS_API}/${userId}/threads?${params.toString()}`;
  const res = await fetch(url, { method: "POST" });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ThreadsApiError(
      `Threads API error (${res.status})`,
      res.status,
      body
    );
  }

  const data = (await res.json()) as { id?: string };
  if (!data.id) {
    throw new ThreadsApiError("Threads API returned no post id", res.status, data);
  }
  return data.id;
}
