import type { ZodError } from "zod";

export class FalconConnectHttpError extends Error {
  override readonly name = "FalconConnectHttpError";
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
  }
}

export class FalconConnectValidationError extends Error {
  override readonly name = "FalconConnectValidationError";
  constructor(
    message: string,
    public readonly zodError: ZodError,
    public readonly context: { method: string; path: string; rawBody?: string },
  ) {
    super(message);
  }

  get issues(): ZodError["issues"] {
    return this.zodError.issues;
  }
}

export class FalconConnectParseError extends Error {
  override readonly name = "FalconConnectParseError";
  constructor(
    message: string,
    public readonly context: { method: string; path: string },
  ) {
    super(message);
  }
}

export class FalconConnectNetworkError extends Error {
  override readonly name = "FalconConnectNetworkError";
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Best-effort message extraction from Connect / gateway JSON bodies. */
export function messageFromApiErrorBody(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const message = body.message;
  if (typeof message === "string" && message.trim()) return message;
  const error = body.error;
  if (typeof error === "string" && error.trim()) return error;
  return undefined;
}
