import { expect, test } from "@playwright/test";

test.describe("Test group", () => {
  test("seed", async ({ page }) => {
    await page.goto("http://localhost:5173/");

    // Welcomeモーダルが表示されている場合はスキップ
    const skipButton = page.getByTestId("welcome-skip-button");
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
      await expect(page.getByTestId("recipe-search-input")).toBeVisible();
    }
  });
});
