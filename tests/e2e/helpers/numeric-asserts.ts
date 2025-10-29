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
  // wait until the numeric value observed in the DOM satisfies the comparator.
  // This avoids blind timeouts and is more resilient than fixed sleeps.
  const waitTimeout = opts?.timeout ?? 500;
  await page.waitForFunction(
    (args: { tid: string; beforeVal: number; cmp: string }) => {
      const { tid, beforeVal, cmp } = args;
      const el = document.querySelector(`[data-testid="${tid}"]`);
      if (!el) return false;
      const text = (el as HTMLElement).innerText.replace(/,/g, "");
      const m = text.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
      if (!m) return false;
      const after = parseFloat(m[0]);
      if (Number.isNaN(after)) return false;
      if (cmp === "changed") return after !== beforeVal;
      if (cmp === "increased") return after > beforeVal;
      if (cmp === "decreased") return after < beforeVal;
      return false;
    },
    { tid: testId, beforeVal: before, cmp: comparator },
    { timeout: waitTimeout }
  );

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
