import type { Dialog, Page } from "@playwright/test";

/**
 * Register a one-time dialog accept handler, run the provided action,
 * and accept the dialog when it appears.
 *
 * Usage:
 * await acceptDialogDuring(page, async () => {
 *   await page.click('button-that-opens-dialog');
 * });
 */
export async function acceptDialogDuring(page: Page, action: () => Promise<void>) {
  page.once("dialog", async (dialog: Dialog) => {
    try {
      await dialog.accept();
    } catch {
      // ignore any errors while accepting the dialog
    }
  });

  await action();
}
