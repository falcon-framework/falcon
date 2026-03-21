import { expect, test } from "@playwright/test";
import {
  DEMO_01_URL,
  DEMO_02_URL,
  connectionLine,
  createIdentity,
  createWorkspace,
  ensureIncomingApprovalReady,
  expectConnectionLine,
  signUpThroughHostedAuth,
} from "./helpers/falcon";

test("Falcon Connect creates and approves a cross-app installation", async ({ page }, testInfo) => {
  const identity = createIdentity(testInfo);
  const expectedLine = connectionLine("Demo 01 Source", "Demo 02 Target");

  await signUpThroughHostedAuth(page, DEMO_01_URL, identity);
  await createWorkspace(page, identity);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "Connect to partner app" }).click();

  await expect(page).toHaveURL(/http:\/\/localhost:3011\/connect\/incoming/);
  await expect(page.getByRole("button", { name: "Continue to Falcon Auth" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Password" })).toHaveCount(0);
  await ensureIncomingApprovalReady(page, identity);
  await expect(page.getByRole("heading", { name: "Approve connection" })).toBeVisible();
  await expect(page.locator("main")).not.toContainText("Unauthorized");
  await expect(page.locator("main")).toContainText("demo.read");

  await page.getByRole("button", { name: "Approve and return to source app" }).click();

  await expect(page).toHaveURL(/http:\/\/localhost:3010\/connect\/done/);
  await expect(page.locator("main")).not.toContainText("Unauthorized");
  await expectConnectionLine(page, expectedLine);
  await expect(page.locator("main")).toContainText("Status:");

  await page.goto(`${DEMO_02_URL}/connections`);
  await expect(page.locator("main")).not.toContainText("Unauthorized");
  await expectConnectionLine(page, expectedLine);
});
