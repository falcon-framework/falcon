import { expect, test } from "@playwright/test";
import {
  approveConnectOnDemo02Incoming,
  connectionLine,
  DEMO_01_URL,
  expectConnectionLine,
  expectTargetConnectionsPageShowsActiveLine,
  startConnectInstallFromDemo01,
} from "./helpers/connect";
import { createIdentity, createWorkspace, signUpThroughHostedAuth } from "./helpers/falcon";

test("Falcon Connect creates and approves a cross-app installation", async ({ page }, testInfo) => {
  const identity = createIdentity(testInfo);
  const expectedLine = connectionLine("Demo 01 Source", "Demo 02 Target");

  await test.step("Source: sign up and workspace", async () => {
    await signUpThroughHostedAuth(page, DEMO_01_URL, identity);
    await createWorkspace(page, identity);
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  await test.step("Source: start install to partner", async () => {
    await startConnectInstallFromDemo01(page);
  });

  await test.step("Target: approve and return", async () => {
    await approveConnectOnDemo02Incoming(page, identity);
  });

  await test.step("Source: done page shows connection", async () => {
    await expect(page).toHaveURL(/http:\/\/localhost:3010\/connect\/done/);
    await expect(page.locator("main")).not.toContainText("Unauthorized");
    await expect
      .poll(async () => page.locator("main").textContent(), { timeout: 20_000 })
      .toContain(expectedLine);
    await expectConnectionLine(page, expectedLine);
    await expect(page.locator("main")).toContainText("Status:");
  });

  await test.step("Target: connections list shows incoming + active", async () => {
    await expectTargetConnectionsPageShowsActiveLine(page, expectedLine);
  });
});

test("Falcon Connect connection row survives reload on source done page", async ({ page }, testInfo) => {
  const identity = createIdentity(testInfo);
  const expectedLine = connectionLine("Demo 01 Source", "Demo 02 Target");

  await signUpThroughHostedAuth(page, DEMO_01_URL, identity);
  await createWorkspace(page, identity);
  await expect(page).toHaveURL(/\/dashboard$/);

  await startConnectInstallFromDemo01(page);
  await approveConnectOnDemo02Incoming(page, identity);

  await expect(page).toHaveURL(/http:\/\/localhost:3010\/connect\/done/);
  await expect
    .poll(async () => page.locator("main").textContent(), { timeout: 20_000 })
    .toContain(expectedLine);

  await page.reload();
  await expect(page).toHaveURL(/http:\/\/localhost:3010\/connect\/done/);
  await expect
    .poll(async () => page.locator("main").textContent(), { timeout: 20_000 })
    .toContain(expectedLine);
  await expectConnectionLine(page, expectedLine);
});
