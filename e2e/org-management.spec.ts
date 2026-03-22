import { expect, test } from "@playwright/test";
import {
  DEMO_01_URL,
  createAdditionalWorkspace,
  createIdentity,
  createWorkspace,
  signUpThroughHostedAuth,
} from "./helpers/falcon";

test("demo-01 OrganizationSwitcher lists workspaces and switches active org", async ({
  page,
}, testInfo) => {
  const identity = createIdentity(testInfo);

  await signUpThroughHostedAuth(page, DEMO_01_URL, identity);
  await createWorkspace(page, identity);
  await expect(page).toHaveURL(/\/dashboard$/);

  await createAdditionalWorkspace(
    page,
    identity.secondOrgName,
    identity.secondOrgSlug,
    /\/dashboard$/,
  );

  const shell = page.getByTestId("demo-org-switcher");
  await expect(shell).toBeVisible();

  await expect(shell.getByRole("button")).toContainText(identity.secondOrgName, {
    timeout: 15_000,
  });

  await shell.getByRole("button").click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: identity.orgName }).click();

  await expect(shell.getByRole("button")).toContainText(identity.orgName, { timeout: 15_000 });
});
