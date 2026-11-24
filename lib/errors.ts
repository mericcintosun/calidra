// Error codes for the API boundary. Responses carry a code and one fixed human hint per code;
// raw messages and stacks never leave the server. Pure module: safe to import anywhere.

export type ErrorCode = "invalid_input" | "upstream_timeout" | "upstream_error" | "parse_failure" | "not_configured";

export interface ApiError {
  error: ErrorCode;
  hint: string;
}

const HINTS: Record<ErrorCode, string> = {
  invalid_input:
    "Check the request: pass a site slug, or lat and lon, with a date from 1950-01-01 to 15 days ahead. Place searches need 2 to 80 characters.",
  upstream_timeout: "The weather service took too long to answer. Try again in a minute.",
  upstream_error: "The weather service could not be reached or answered with an error. Try again in a minute.",
  parse_failure: "The weather service answered, but not with complete hours for that place and date.",
  not_configured: "This server is not set up to answer that request.",
};

export class CalidraError extends Error {
  readonly code: ErrorCode;

  /** `detail` stays in server logs only; it is never sent to the browser. */
  constructor(code: ErrorCode, detail?: string) {
    super(detail ?? code);
    this.name = "CalidraError";
    this.code = code;
  }
}

export function hintFor(code: ErrorCode): string {
  return HINTS[code];
}

export function codeOf(e: unknown): ErrorCode {
  return e instanceof CalidraError ? e.code : "upstream_error";
}

/** The public shape of any failure. Unknown errors map to upstream_error with its fixed hint. */
export function toApiError(e: unknown): ApiError {
  const code = codeOf(e);
  return { error: code, hint: HINTS[code] };
}

/** HTTP status for a code: 400 for bad input, 504 for a timeout, 502 for everything else. */
export function statusFor(code: ErrorCode): number {
  if (code === "invalid_input") return 400;
  if (code === "upstream_timeout") return 504;
  return 502;
}
