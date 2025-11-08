import { expect } from "@playwright/test";
import { test } from "./fixtures";

test.describe("Test group", () => {
  test("seed", async ({ appPage }) => {
    // appPageフィクスチャでlocalStorageが設定されているため、Welcomeモーダルは表示されない
    await expect(appPage.getByTestId("recipe-search-input")).toBeVisible();
  });
});
