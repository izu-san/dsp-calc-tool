import type { Page } from "@playwright/test";

/**
 * Read the first numeric value from the innerText of the given testId element.
 * Returns NaN if no number is found.
 */
export async function readFirstNumberFromTestId(page: Page, testId: string) {
  const locator = page.getByTestId(testId);
  if ((await locator.count()) === 0) return NaN;
  const text = await locator.first().innerText();
  const m = text.replace(/,/g, "").match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  return m ? parseFloat(m[0]) : NaN;
}

/**
 * Read any numeric value from arbitrary locator's innerText by Playwright selector
 */
export async function readFirstNumberFromLocatorText(text: string) {
  const cleaned = text.replace(/,/g, "");
  const m = cleaned.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  return m ? parseFloat(m[0]) : NaN;
}

/**
 * Perform action callback and assert that the numeric value read from testId changed
 * according to comparator ('increased' | 'decreased' | 'changed').
 */
export async function expectNumberChange(
  page: Page,
  testId: string,
  action: () => Promise<void>,
  comparator: "increased" | "decreased" | "changed" = "changed",
  opts?: { timeout?: number }
) {
  const before = await readFirstNumberFromTestId(page, testId);
  await action();
  // small wait for UI to update
  if (opts?.timeout) await page.waitForTimeout(opts.timeout);
  else await page.waitForTimeout(500);
  const after = await readFirstNumberFromTestId(page, testId);

  if (isNaN(before) || isNaN(after)) {
    throw new Error(
      `Could not read numeric values for testId=${testId} (before=${before}, after=${after})`
    );
  }

  if (comparator === "increased" && !(after > before)) {
    throw new Error(`Expected value for ${testId} to increase: before=${before} after=${after}`);
  }
  if (comparator === "decreased" && !(after < before)) {
    throw new Error(`Expected value for ${testId} to decrease: before=${before} after=${after}`);
  }
  if (comparator === "changed" && after === before) {
    throw new Error(`Expected value for ${testId} to change: before=${before} after=${after}`);
  }
}

export default {};
