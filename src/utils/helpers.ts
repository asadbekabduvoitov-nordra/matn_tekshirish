export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Executes an async function with automatic retry on Telegram 429 rate limit errors.
 * Waits for the retry_after duration specified by Telegram before retrying.
 */
export async function sendWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const retryAfter = extractRetryAfter(error);
      if (retryAfter !== null && attempt < maxRetries) {
        await sleep((retryAfter + 1) * 1000);
        continue;
      }
      throw error;
    }
  }
  throw new Error("sendWithRetry: unreachable");
}

function extractRetryAfter(error: unknown): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const resp = (error as { response: { error_code?: number; parameters?: { retry_after?: number } } }).response;
    if (resp.error_code === 429 && resp.parameters?.retry_after) {
      return resp.parameters.retry_after;
    }
  }
  return null;
}
