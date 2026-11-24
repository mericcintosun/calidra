// The one outbound HTTP helper. Every request to Open-Meteo goes through fetchJson():
// a timeout per attempt, exactly HTTP_RETRIES extra attempts for timeouts, network errors
// and 5xx answers, no retry on 4xx. Failures become CalidraError codes. Logs carry the
// host, status, duration and attempt only: never the full URL, query or response body.

import { HTTP_RETRIES, HTTP_TIMEOUT_MS, LOG_PREFIX } from "./config";
import { CalidraError, type ErrorCode } from "./errors";

export interface FetchJsonOptions {
  /** Seconds the Next.js data cache may keep this answer. */
  revalidate: number;
}

/** RequestInit plus the Next.js cache hint, typed here so the helper also compiles outside Next. */
type NextRequestInit = RequestInit & { next?: { revalidate?: number } };

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}

function isTimeout(e: unknown): boolean {
  return e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
}

export async function fetchJson(url: string, { revalidate }: FetchJsonOptions): Promise<unknown> {
  const host = hostOf(url);
  const attempts = HTTP_RETRIES + 1;
  let lastCode: ErrorCode = "upstream_error";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const started = Date.now();
    const init: NextRequestInit = { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS), next: { revalidate } };
    try {
      const res = await fetch(url, init);
      const ms = Date.now() - started;
      if (res.status >= 500) {
        lastCode = "upstream_error";
        console.warn(`${LOG_PREFIX} fetch fail host=${host} status=${res.status} ms=${ms} attempt=${attempt}/${attempts}`);
        continue;
      }
      if (!res.ok) {
        console.warn(`${LOG_PREFIX} fetch fail host=${host} status=${res.status} ms=${ms} attempt=${attempt}/${attempts} retry=no`);
        throw new CalidraError("upstream_error", `status ${res.status}`);
      }
      let body: unknown;
      try {
        body = await res.json();
      } catch (e) {
        if (isTimeout(e)) throw e;
        console.warn(`${LOG_PREFIX} fetch body unreadable host=${host} ms=${Date.now() - started} attempt=${attempt}/${attempts}`);
        throw new CalidraError("parse_failure", "body is not JSON");
      }
      console.info(`${LOG_PREFIX} fetch ok host=${host} status=${res.status} ms=${Date.now() - started} attempt=${attempt}/${attempts}`);
      return body;
    } catch (e) {
      if (e instanceof CalidraError) throw e;
      lastCode = isTimeout(e) ? "upstream_timeout" : "upstream_error";
      console.warn(`${LOG_PREFIX} fetch fail host=${host} code=${lastCode} ms=${Date.now() - started} attempt=${attempt}/${attempts}`);
    }
  }

  throw new CalidraError(lastCode, `gave up after ${attempts} attempts`);
}
