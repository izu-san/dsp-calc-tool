/**
 * E2E Test Fixtures
 *
 * Centralized fixtures for E2E tests to reduce duplication and improve maintainability.
 */

import { testDataFixture } from "./test-data.fixture";
import { browserFixture } from "./browser.fixture";

/**
 * Combined fixture that includes all fixtures
 * This is the main fixture that should be used in tests
 */
export const test = testDataFixture.extend(browserFixture);

// Export individual fixtures for custom combinations if needed
export { appFixture } from "./app.fixture";
export { testDataFixture } from "./test-data.fixture";
export { browserFixture } from "./browser.fixture";
