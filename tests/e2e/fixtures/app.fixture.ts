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
    // Navigate with retry logic for better stability
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await disableAnimations(page);

    // Wait for welcome modal and skip it
    const welcomeModal = page.getByTestId("welcome-modal");
    try {
      // Wait for the modal to appear (with timeout)
      await welcomeModal.waitFor({ state: "visible", timeout: 5000 });
      await page.getByTestId("welcome-skip-button").click();
      await welcomeModal.waitFor({ state: "hidden" });
    } catch {
      // Modal might not appear if tutorial was already seen
      console.log("Welcome modal not found or already hidden");
    }

    // Ensure tutorial flag is set to prevent modal from appearing again
    await page.evaluate(() => {
      localStorage.setItem("dsp_calc_tutorial_seen", "true");
    });

    await use(page);
  },
});

export const test = appFixture;
