import { describe, expect, it } from "vitest";
import { buildFalconConnectHeaders } from "./connect-headers";

describe("buildFalconConnectHeaders", () => {
  it("sets Falcon and organization headers", () => {
    const h = buildFalconConnectHeaders({
      publishableKey: "pk_test",
      organizationId: "org_1",
    });
    expect(h.get("X-Falcon-App-Id")).toBe("pk_test");
    expect(h.get("X-Organization-Id")).toBe("org_1");
  });

  it("merges with init headers", () => {
    const h = buildFalconConnectHeaders({
      publishableKey: "pk_test",
      organizationId: "org_1",
      init: { "Content-Type": "application/json" },
    });
    expect(h.get("Content-Type")).toBe("application/json");
    expect(h.get("X-Organization-Id")).toBe("org_1");
  });

  it("throws when organizationId is empty", () => {
    expect(() =>
      buildFalconConnectHeaders({ publishableKey: "pk_test", organizationId: "  " }),
    ).toThrow(/organizationId/);
  });
});
