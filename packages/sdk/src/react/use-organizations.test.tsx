import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOrganizations } from "./use-organizations";

const create = vi.fn();
const setActive = vi.fn();
const refetch = vi.fn();

const useListOrganizations = vi.fn(() => ({
  data: [{ id: "o1", name: "Acme", slug: "acme" }],
  isPending: false,
  error: null,
  refetch,
}));

vi.mock("./provider", () => ({
  useFalconAuthContext: () => ({
    client: {
      useListOrganizations,
      organization: { create, setActive },
    },
  }),
}));

describe("useOrganizations", () => {
  it("normalizes organizations and wires create and setActive", () => {
    const { result } = renderHook(() => useOrganizations());

    expect(result.current.organizations).toEqual([{ id: "o1", name: "Acme", slug: "acme" }]);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.refetch).toBe(refetch);

    void result.current.create({ name: "x", slug: "x" });
    expect(create).toHaveBeenCalledWith({ name: "x", slug: "x" });

    void result.current.setActive({ organizationId: "o1" });
    expect(setActive).toHaveBeenCalledWith({ organizationId: "o1" });
  });
});
