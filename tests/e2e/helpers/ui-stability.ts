import type { Page } from "@playwright/test";

/**
 * Disable CSS animations/transitions and smooth scrolling to improve test stability.
 * Injects a style tag into the page; call this early in each test (e.g., in beforeEach).
 */
export async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
      html:focus-within { scroll-behavior: auto !important; }
      /* Tailwind ripple/hover effects that may animate */
      .ripple-effect, .ripple { animation: none !important; }
    `,
  });
}

export default { disableAnimations };
