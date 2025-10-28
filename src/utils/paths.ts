/**
 * Get the base URL for assets
 * Always returns '/' for custom domain (dsp-calc.com)
 */
export function getBasePath(): string {
  return import.meta.env.BASE_URL || "/";
}

/**
 * Get the full path for a data file
 */
export function getDataPath(path: string): string {
  const basePath = getBasePath();
  // Remove leading slash from path if exists
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${basePath}${cleanPath}`;
}
