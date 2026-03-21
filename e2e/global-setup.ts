const READY_URLS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3010/sign-in",
  "http://localhost:3011/sign-in",
];

async function waitForUrl(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError = "unknown error";

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = `status ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

export default async function globalSetup(): Promise<void> {
  for (const url of READY_URLS) {
    await waitForUrl(url);
  }
}
