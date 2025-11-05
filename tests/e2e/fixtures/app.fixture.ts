import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import { disableAnimations } from "../helpers/ui-stability";

/**
 * App fixture: Provides a page with app initialized and welcome modal skipped
 */
export const appFixture = base.extend<{
  appPage: Page;
}>({
  appPage: async ({ page }, use) => {
    // Set localStorage before navigation to skip welcome modal
    await page.addInitScript(() => {
      localStorage.setItem("dsp_calc_tutorial_seen", "true");
    });

    // Navigate with retry logic for better stability
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await disableAnimations(page);

    await use(page);
  },
});

export const test = appFixture;
