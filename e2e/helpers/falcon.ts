import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";

export const DEMO_01_URL = "http://localhost:3010";
export const DEMO_02_URL = "http://localhost:3011";
const AUTH_SERVER_URL = "http://localhost:3000";
const PUBLISHABLE_KEY_BY_APP_URL: Record<string, string> = {
  [DEMO_01_URL]: "pk_demo_source",
  [DEMO_02_URL]: "pk_demo_target",
};

export const URL_EXPECT_TIMEOUT = 5_000;

export interface Identity {
  name: string;
  email: string;
  password: string;
  orgName: string;
  orgSlug: string;
  /** Second workspace on the same app (e.g. demo-01 org switcher tests). */
  secondOrgName: string;
  secondOrgSlug: string;
  targetOrgName: string;
  targetOrgSlug: string;
}

export function createIdentity(testInfo: TestInfo): Identity {
  const suffix = `${Date.now().toString(36)}-${testInfo.retry}-${testInfo.parallelIndex}`;
  return {
    name: `Demo User ${suffix}`,
    email: `demo-${suffix}@example.com`,
    password: `Password!${suffix}`,
    orgName: `Workspace ${suffix}`,
    orgSlug: `workspace-${suffix}`.replace(/[^a-z0-9-]/g, "-"),
    secondOrgName: `Extra Workspace ${suffix}`,
    secondOrgSlug: `extra-workspace-${suffix}`.replace(/[^a-z0-9-]/g, "-"),
    targetOrgName: `Partner Workspace ${suffix}`,
    targetOrgSlug: `partner-workspace-${suffix}`.replace(/[^a-z0-9-]/g, "-"),
  };
}

export async function signUpThroughHostedAuth(
  page: Page,
  appUrl: string,
  identity: Identity,
): Promise<void> {
  await page.goto(`${appUrl}/sign-up`);
  await expect(page.getByRole("button", { name: "Continue to Falcon Auth" })).toBeVisible();

  await page.goto(await buildHostedAuthUrl(page, appUrl, "/auth/sign-up"));
  await expect(page).toHaveURL(/http:\/\/localhost:3000\/auth\/sign-up/, {
    timeout: URL_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await page.getByRole("textbox", { name: "Full name" }).fill(identity.name);
  await page.getByRole("textbox", { name: "Email" }).fill(identity.email);
  await page.getByRole("textbox", { name: "Password" }).fill(identity.password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Sign-in failed" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "User menu" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/sign-in$/);
}

export async function signInThroughHostedAuth(
  page: Page,
  appUrl: string,
  identity: Identity,
): Promise<void> {
  await page.goto(`${appUrl}/sign-in`);
  await expect(page.getByRole("button", { name: "Continue to Falcon Auth" })).toBeVisible();

  await page.goto(await buildHostedAuthUrl(page, appUrl, "/auth/authorize"));
  await expect(page).toHaveURL(/http:\/\/localhost:3000\/auth\/authorize/, {
    timeout: URL_EXPECT_TIMEOUT,
  });
  await expect(page.getByRole("heading", { name: /Sign in to/ })).toBeVisible();
  await page.getByRole("textbox", { name: "Email" }).fill(identity.email);
  await page.getByRole("textbox", { name: "Password" }).fill(identity.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Sign-in failed" })).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/sign-in$/);
}

export async function createWorkspace(page: Page, identity: Identity): Promise<void> {
  await maybeCreateWorkspace(page, identity.orgName, identity.orgSlug, /\/dashboard$/);
}

/** Create another workspace on demo-01 while already signed in (navigates to `/org/create`). */
export async function createAdditionalWorkspace(
  page: Page,
  name: string,
  slug: string,
  expectedUrl: RegExp = /\/dashboard$/,
): Promise<void> {
  await page.goto(`${DEMO_01_URL}/org/create`);
  await expect(page.getByRole("heading", { name: "Create a workspace" })).toBeVisible();
  await page.getByRole("textbox", { name: "Workspace name" }).fill(name);
  await page.getByRole("textbox", { name: "Slug" }).fill(slug);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(expectedUrl);
}

export async function signOutFromUserMenu(page: Page): Promise<void> {
  await page.getByRole("button", { name: "User menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: /^Sign in$/ }).first()).toBeVisible();
}

export async function expectConnectionLine(page: Page, line: string): Promise<void> {
  await expect(page.locator("li").filter({ hasText: line }).first()).toBeVisible();
}

export async function ensureIncomingApprovalReady(page: Page, identity: Identity): Promise<void> {
  const approveButton = page.getByRole("button", { name: "Approve and return to source app" });
  if (await approveButton.isVisible().catch(() => false)) {
    return;
  }

  const incomingUrl = page.url();
  const initialState = await waitForIncomingStep(page, approveButton);
  if (initialState === "hosted-sign-in") {
    const resumePath = new URL(incomingUrl).pathname + new URL(incomingUrl).search;
    await page.evaluate((pendingPath) => {
      sessionStorage.setItem("falcon-demo02:pendingConnect", pendingPath);
    }, resumePath);
    await signInThroughHostedAuth(page, DEMO_02_URL, identity);
  } else if (initialState === "error") {
    throw new Error(await readMainText(page));
  }

  await maybeCreateWorkspace(
    page,
    identity.targetOrgName,
    identity.targetOrgSlug,
    /\/connect\/incoming/,
  );

  await expect(approveButton).toBeVisible();
}

export function connectionLine(sourceLabel: string, targetLabel: string): string {
  return `${sourceLabel} → ${targetLabel}`;
}

export function listItemByText(page: Page, text: string): Locator {
  return page.locator("li").filter({ hasText: text }).first();
}

async function buildHostedAuthUrl(
  page: Page,
  appUrl: string,
  authPath: "/auth/authorize" | "/auth/sign-up",
): Promise<string> {
  const publishableKey = PUBLISHABLE_KEY_BY_APP_URL[appUrl];
  if (!publishableKey) {
    throw new Error(`Missing publishable key mapping for app URL: ${appUrl}`);
  }

  return page.evaluate(
    ({ authServerUrl, authPath, publishableKey }) => {
      const state = crypto.randomUUID();
      sessionStorage.setItem("falcon_auth_state", state);
      const url = new URL(`${authServerUrl}${authPath}`);
      url.searchParams.set("client_id", publishableKey);
      // @ts-expect-error window is available in the evaluate context
      url.searchParams.set("redirect_uri", `${window.location.origin}/auth/callback`);
      url.searchParams.set("state", state);
      return url.toString();
    },
    { authServerUrl: AUTH_SERVER_URL, authPath, publishableKey },
  );
}

async function maybeCreateWorkspace(
  page: Page,
  name: string,
  slug: string,
  expectedUrl: RegExp,
): Promise<void> {
  if (!page.url().includes("/org/create")) {
    return;
  }

  await page.getByRole("textbox", { name: "Workspace name" }).fill(name);
  await page.getByRole("textbox", { name: "Slug" }).fill(slug);
  await page.getByRole("button", { name: "Create workspace" }).click();
  await expect(page).toHaveURL(expectedUrl);
}

async function waitForIncomingStep(
  page: Page,
  approveButton: Locator,
  timeout = 10_000,
): Promise<"approve" | "hosted-sign-in" | "org-create" | "error"> {
  let state: "approve" | "hosted-sign-in" | "org-create" | "error" = "error";

  await expect
    .poll(
      async () => {
        if (await approveButton.isVisible().catch(() => false)) {
          return "approve";
        }
        if (page.url().includes("/org/create")) {
          return "org-create";
        }
        if (
          await page
            .getByRole("button", { name: "Continue to Falcon Auth" })
            .isVisible()
            .catch(() => false)
        ) {
          return "hosted-sign-in";
        }
        const mainText = await readMainText(page);
        if (mainText.includes("unauthorized") || mainText.includes("failed")) {
          return "error";
        }
        return "pending";
      },
      { timeout },
    )
    .not.toBe("pending");

  if (await approveButton.isVisible().catch(() => false)) {
    state = "approve";
  } else if (page.url().includes("/org/create")) {
    state = "org-create";
  } else if (
    await page
      .getByRole("button", { name: "Continue to Falcon Auth" })
      .isVisible()
      .catch(() => false)
  ) {
    state = "hosted-sign-in";
  } else {
    state = "error";
  }

  return state;
}

async function readMainText(page: Page): Promise<string> {
  return (
    (
      await page
        .locator("main")
        .textContent()
        .catch(() => "")
    )?.toLowerCase() ?? ""
  );
}
