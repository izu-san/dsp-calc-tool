import type { Page } from "@playwright/test";
import { disableAnimations } from "../helpers/ui-stability";
import { appFixture } from "./app.fixture";

/**
 * Browser fixture: Provides utilities for browser operations (reload, viewport, etc.)
 * Extends appFixture to have access to appPage
 */
export const browserFixture = appFixture.extend<{
  reloadPage: () => Promise<void>;
  setViewport: (width: number, height: number) => Promise<void>;
  newPage: () => Promise<Page>;
}>({
  reloadPage: async ({ appPage }, use) => {
    await use(async () => {
      await appPage.reload();
      // Re-inject styles after reload since document changed
      await disableAnimations(appPage);
      // Skip welcome modal if it appears after reload
      const welcomeModal = appPage.getByTestId("welcome-modal");
      if (await welcomeModal.isVisible().catch(() => false)) {
        await appPage.getByTestId("welcome-skip-button").click();
        await welcomeModal.waitFor({ state: "hidden" });
      }
    });
  },

  setViewport: async ({ appPage }, use) => {
    await use(async (width: number, height: number) => {
      await appPage.setViewportSize({ width, height });
    });
  },

  newPage: async ({ appPage }, use) => {
    await use(async () => {
      return await appPage.context().newPage();
    });
  },
});
