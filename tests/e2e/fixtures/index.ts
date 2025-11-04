/**
 * E2E Test Fixtures
 *
 * Centralized fixtures for E2E tests to reduce duplication and improve maintainability.
 */

import type { Page } from "@playwright/test";
import { disableAnimations } from "../helpers/ui-stability";
import { appFixture } from "./app.fixture";

/**
 * Combined fixture that includes all fixtures
 * This is the main fixture that should be used in tests
 */
export const test = appFixture.extend<{
  // Test data fixtures
  clearLocalStorage: () => Promise<void>;
  clearLocalStorageKeepingTutorial: () => Promise<void>;
  setLocalStorage: (key: string, value: string) => Promise<void>;
  getLocalStorage: (key: string) => Promise<string | null>;
  // Browser fixtures
  reloadPage: () => Promise<void>;
  setViewport: (width: number, height: number) => Promise<void>;
  newPage: () => Promise<Page>;
}>({
  // Test data fixtures
  clearLocalStorage: async ({ appPage }, use) => {
    await use(async () => {
      await appPage.evaluate(() => {
        const tutorialSeen = localStorage.getItem("dsp_calc_tutorial_seen");
        localStorage.clear();
        if (tutorialSeen) {
          localStorage.setItem("dsp_calc_tutorial_seen", tutorialSeen);
        }
      });
    });
  },

  clearLocalStorageKeepingTutorial: async ({ appPage }, use) => {
    await use(async () => {
      await appPage.evaluate(() => {
        const tutorialSeen = localStorage.getItem("dsp_calc_tutorial_seen");
        localStorage.clear();
        if (tutorialSeen) {
          localStorage.setItem("dsp_calc_tutorial_seen", tutorialSeen);
        } else {
          localStorage.setItem("dsp_calc_tutorial_seen", "true");
        }
      });
    });
  },

  setLocalStorage: async ({ appPage }, use) => {
    await use(async (key: string, value: string) => {
      await appPage.evaluate(
        ({ key, value }) => {
          localStorage.setItem(key, value);
        },
        { key, value }
      );
    });
  },

  getLocalStorage: async ({ appPage }, use) => {
    await use(async (key: string) => {
      return await appPage.evaluate((key: string) => {
        return localStorage.getItem(key);
      }, key);
    });
  },

  // Browser fixtures
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

// Export individual fixtures for custom combinations if needed
export { appFixture } from "./app.fixture";
