import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { disableAnimations } from "../helpers/ui-stability";

/**
 * App fixture: Provides a page with app initialized and welcome modal skipped
 */
export const appFixture = base.extend<{
  appPage: Page;
}>({
  appPage: async ({ page }, use) => {
    await page.goto("/");
    await disableAnimations(page);
    // Skip welcome modal if it exists
    const welcomeModal = page.getByTestId("welcome-modal");
    if (await welcomeModal.isVisible().catch(() => false)) {
      await page.getByTestId("welcome-skip-button").click();
      await welcomeModal.waitFor({ state: "hidden" });
    }
    await use(page);
  },
});

export const test = appFixture;
