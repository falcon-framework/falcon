import { expect, test } from "@playwright/test";
import {
  DEMO_01_URL,
  createIdentity,
  createWorkspace,
  signOutFromUserMenu,
  signUpThroughHostedAuth,
} from "./helpers/falcon";

test("Falcon Auth hosted flow establishes and preserves the demo-01 session", async ({
  page,
}, testInfo) => {
  const identity = createIdentity(testInfo);

  await signUpThroughHostedAuth(page, DEMO_01_URL, identity);

  await expect(page).toHaveURL(/\/(dashboard|org\/create)$/);
  await createWorkspace(page, identity);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect to partner app" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Connect to partner app" })).toBeVisible();

  await signOutFromUserMenu(page);
  await expect(page).toHaveURL(`${DEMO_01_URL}/`);
});
