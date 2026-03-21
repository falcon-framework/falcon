import { describe, expect, it, vi } from "vitest";
import { completeAuthCallback } from "./auth-callback";

describe("completeAuthCallback", () => {
  it("exchanges the code and accepts a visible session", async () => {
    const exchangeCode = vi.fn(async () => undefined);
    const getSession = vi.fn(async () => ({
      data: {
        user: { id: "user_123" },
        session: { id: "session_123" },
      },
    }));

    await expect(
      completeAuthCallback({
        code: "code_123",
        state: "state_123",
        storedState: "state_123",
        exchangeCode,
        getSession,
      }),
    ).resolves.toBeUndefined();

    expect(exchangeCode).toHaveBeenCalledWith("code_123");
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("fails when the session never becomes visible after exchange", async () => {
    const exchangeCode = vi.fn(async () => undefined);
    const getSession = vi.fn(async () => ({ data: null }));
    const wait = vi.fn(async () => undefined);

    await expect(
      completeAuthCallback({
        code: "code_123",
        state: "state_123",
        storedState: "state_123",
        exchangeCode,
        getSession,
        wait,
        maxSessionChecks: 3,
        retryDelayMs: 5,
      }),
    ).rejects.toThrow(
      "Sign-in completed, but the session is still not available in this app. Please try again.",
    );

    expect(exchangeCode).toHaveBeenCalledWith("code_123");
    expect(getSession).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });
});
