import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrganizationSwitcher } from "./organization-switcher";

const switchOrg = vi.fn();

vi.mock("../hooks", () => ({
  useFalconAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: { id: "u1", name: "U" },
    session: null,
    signOut: vi.fn(),
    client: {} as never,
  }),
}));

vi.mock("../active-organization", () => ({
  useActiveOrganization: () => ({
    activeOrg: { id: "1", name: "Acme", slug: "acme" },
    orgs: [
      { id: "1", name: "Acme", slug: "acme" },
      { id: "2", name: "Beta", slug: "beta" },
    ],
    isLoading: false,
    switchOrg,
  }),
}));

describe("OrganizationSwitcher", () => {
  it("opens the menu and switches organization", async () => {
    render(<OrganizationSwitcher />);

    fireEvent.click(screen.getByRole("button", { name: /acme/i }));
    expect(screen.getByRole("menu")).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: /beta/i }));
    expect(switchOrg).toHaveBeenCalledWith("2");
  });
});
