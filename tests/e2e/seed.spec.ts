import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("Test group", () => {
  test("seed", async ({ appPage }) => {
    // Welcomeモーダルが表示されている場合はスキップ
    const skipButton = appPage.getByTestId("welcome-skip-button");
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await expect(appPage.getByTestId("recipe-search-input")).toBeVisible();
    }
  });
});
