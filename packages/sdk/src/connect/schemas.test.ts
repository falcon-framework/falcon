import { describe, expect, it } from "vitest";
import {
  createInstallationRequestBodySchema,
  falconConnectAppSchema,
  falconConnectConnectionDetailSchema,
  falconConnectConnectionsListSchema,
} from "./schemas";

describe("Falcon Connect Zod schemas", () => {
  it("parses a valid app row", () => {
    const row = {
      id: "a1",
      slug: "s",
      name: "N",
      description: null,
      status: "active",
      createdAt: "2025-01-01T00:00:00.000Z",
    };
    expect(falconConnectAppSchema.parse(row)).toEqual(row);
  });

  it("rejects invalid app status", () => {
    expect(() =>
      falconConnectAppSchema.parse({
        id: "a1",
        slug: "s",
        name: "N",
        description: null,
        status: "weird",
        createdAt: "x",
      }),
    ).toThrow();
  });

  it("parses connection detail with nullable settings", () => {
    const detail = {
      id: "c1",
      organizationId: "o1",
      sourceAppId: "s1",
      targetAppId: "t1",
      status: "active",
      createdByUserId: "u1",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
      scopes: ["demo.read"],
      settings: null,
    };
    expect(falconConnectConnectionDetailSchema.parse(detail)).toEqual(detail);
  });

  it("parses connection list", () => {
    const list = [
      {
        id: "c1",
        organizationId: "o1",
        sourceAppId: "s1",
        targetAppId: "t1",
        status: "paused",
        createdByUserId: "u1",
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-02T00:00:00.000Z",
      },
    ];
    expect(falconConnectConnectionsListSchema.parse(list)).toEqual(list);
  });

  it("rejects create installation body with empty scopes", () => {
    expect(() =>
      createInstallationRequestBodySchema.parse({
        sourceAppId: "a",
        targetAppId: "b",
        requestedScopes: [],
      }),
    ).toThrow();
  });
});
