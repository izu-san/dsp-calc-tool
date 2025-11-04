import { appFixture } from "./app.fixture";

/**
 * Test data fixture: Provides utilities for managing test data (localStorage, etc.)
 * Extends appFixture to have access to appPage
 */
export const testDataFixture = appFixture.extend<{
  clearLocalStorage: () => Promise<void>;
  clearLocalStorageKeepingTutorial: () => Promise<void>;
  setLocalStorage: (key: string, value: string) => Promise<void>;
  getLocalStorage: (key: string) => Promise<string | null>;
}>({
  clearLocalStorage: async ({ appPage }, use) => {
    await use(async () => {
      await appPage.evaluate(() => {
        localStorage.clear();
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
});
