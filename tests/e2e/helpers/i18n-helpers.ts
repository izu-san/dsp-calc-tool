import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export async function waitForLanguage(page: Page, lang = 'en') {
  // Wait until the HTML lang attribute changes to the requested language
  await expect(page.locator('html')).toHaveAttribute('lang', lang, { timeout: 5000 });
}

export async function selectLanguage(page: Page, lang: string) {
  const selector = page.getByRole('combobox');
  await expect(selector).toBeVisible();
  await selector.selectOption([lang]);
  await waitForLanguage(page, lang);
}

export async function clickRecipeByName(page: Page, name: string) {
  // RecipeGrid renders recipe entries as buttons with title/name
  const btn = page.getByRole('button', { name }).first();
  await expect(btn).toBeVisible();
  await btn.click();
}

export function getTargetLabelLocator(page: Page): Locator {
  // The target label is rendered inside a <label> element in SettingsPanelSection
  return page.locator('label', { hasText: /Target|目標/ }).first();
}

export function getProductionHeadingLocator(page: Page): Locator {
  // Production Results panel heading
  return page.getByRole('heading', { name: /Production Chain|生産チェーン|Production Tree/ }).first();
}

export function getProductionRootTitleLocator(page: Page): Locator {
  // Root node title is rendered as the first h4 inside the hologram-panel
  return page.locator('div.hologram-panel').locator('h4').first();
}
