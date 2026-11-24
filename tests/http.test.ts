import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HTTP_RETRIES } from "@/lib/config";
import { CalidraError } from "@/lib/errors";
import { fetchJson } from "@/lib/http";

const URL_UNDER_TEST = "https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function timeoutError(): Error {
  const e = new Error("The operation was aborted due to timeout");
  e.name = "TimeoutError";
  return e;
}

describe("fetchJson", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is configured for exactly one retry", () => {
    expect(HTTP_RETRIES).toBe(1);
  });

  it("retries once after a 500 and returns the second answer", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ reason: "busy" }, 500))
      .mockResolvedValueOnce(json({ hello: "world" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson(URL_UNDER_TEST, { revalidate: 60 })).resolves.toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404 and reports upstream_error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ reason: "not found" }, 404));
    vi.stubGlobal("fetch", fetchMock);

    const p = fetchJson(URL_UNDER_TEST, { revalidate: 60 });
    await expect(p).rejects.toBeInstanceOf(CalidraError);
    await expect(p).rejects.toMatchObject({ code: "upstream_error" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after two 500s with upstream_error", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => json({}, 503));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson(URL_UNDER_TEST, { revalidate: 60 })).rejects.toMatchObject({ code: "upstream_error" });
    expect(fetchMock).toHaveBeenCalledTimes(HTTP_RETRIES + 1);
  });

  it("maps repeated timeouts to upstream_timeout after one retry", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      throw timeoutError();
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson(URL_UNDER_TEST, { revalidate: 60 })).rejects.toMatchObject({ code: "upstream_timeout" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("passes a timeout signal and the cache window to fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ ok: 1 }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson(URL_UNDER_TEST, { revalidate: 1800 });
    const init = fetchMock.mock.calls[0][1] as RequestInit & { next?: { revalidate?: number } };
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.next?.revalidate).toBe(1800);
  });
});
