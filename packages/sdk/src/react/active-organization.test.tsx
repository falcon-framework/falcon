import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { useActiveOrganization } from "./active-organization";

function Bad() {
  useActiveOrganization();
  return null;
}

describe("useActiveOrganization", () => {
  it("throws outside ActiveOrganizationProvider", () => {
    expect(() => {
      render(<Bad />);
    }).toThrow(/ActiveOrganizationProvider/);
  });
});
