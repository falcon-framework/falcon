import { expect, type Page } from "@playwright/test";

import {
  connectionLine,
  DEMO_01_URL,
  DEMO_02_URL,
  ensureIncomingApprovalReady,
  expectConnectionLine,
  type Identity,
} from "./falcon";

export { connectionLine, DEMO_01_URL, DEMO_02_URL, expectConnectionLine, type Identity };

/** Clicks “Connect to partner app” from demo-01 dashboard (user must be signed in). */
export async function startConnectInstallFromDemo01(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Connect to partner app" }).click();
  await expect(page).toHaveURL(/http:\/\/localhost:3011\/connect\/incoming/);
}

/** Completes target-side sign-in/org if needed, then approves the pending install request. */
export async function approveConnectOnDemo02Incoming(
  page: Page,
  identity: Identity,
): Promise<void> {
  await expect(page.getByRole("button", { name: "Continue to Falcon Auth" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Password" })).toHaveCount(0);
  await ensureIncomingApprovalReady(page, identity);
  await expect(page.getByRole("heading", { name: "Approve connection" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Unauthorized");
  await expect(page.locator("main")).toContainText("demo.read");
  await page.getByRole("button", { name: "Approve and return to source app" }).click();
}

/** Asserts demo-02 connections page shows the line under incoming and an active status. */
export async function expectTargetConnectionsPageShowsActiveLine(
  page: Page,
  line: string,
): Promise<void> {
  await page.goto(`${DEMO_02_URL}/connections`);
  await expect(page.locator("main")).not.toContainText("Unauthorized");
  await expect(
    page.getByRole("heading", { name: "Apps connected to this application" }),
  ).toBeVisible();
  await expectConnectionLine(page, line);
  await expect(page.locator("main")).toContainText("Status:");
  await expect(page.locator("main")).toContainText(/active/i);
}
