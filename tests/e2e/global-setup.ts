import { execSync } from "child_process";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

// Resolve __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Global setup for Playwright tests.
 * This runs once before all tests.
 */
async function globalSetup() {
  console.log("Running global setup...");

  // Generate RECIPE_SIDS.md file
  console.log("Generating RECIPE_SIDS.md...");
  try {
    execSync("npm run generate:recipe-sids", {
      cwd: path.resolve(__dirname, "../.."),
      stdio: "inherit",
    });
    console.log("RECIPE_SIDS.md generated successfully");
  } catch (error) {
    console.error("Failed to generate RECIPE_SIDS.md:", error);
    throw error;
  }
}

export default globalSetup;
