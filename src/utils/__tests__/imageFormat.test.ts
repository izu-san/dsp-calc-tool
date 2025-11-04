import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Dynamic imports to allow module reset
let checkWebPSupport: typeof import("../imageFormat").checkWebPSupport;
let isWebPSupported: typeof import("../imageFormat").isWebPSupported;
let getOptimalImagePath: typeof import("../imageFormat").getOptimalImagePath;
let getImageSourceSet: typeof import("../imageFormat").getImageSourceSet;
let initializeImageFormatSupport: typeof import("../imageFormat").initializeImageFormatSupport;

describe("imageFormat", () => {
  beforeEach(async () => {
    // Reset modules to clear WebP support cache
    vi.resetModules();

    // Re-import module functions
    const module = await import("../imageFormat");
    checkWebPSupport = module.checkWebPSupport;
    isWebPSupported = module.isWebPSupported;
    getOptimalImagePath = module.getOptimalImagePath;
    getImageSourceSet = module.getImageSourceSet;
    initializeImageFormatSupport = module.initializeImageFormatSupport;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkWebPSupport", () => {
    it("should return true for WebP-supported browsers", async () => {
      // Mock Image to simulate WebP support
      global.Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          // Simulate successful load
          setTimeout(() => {
            this.width = 1;
            this.height = 1;
            this.onload?.();
          }, 0);
        }
      } as any;

      const result = await checkWebPSupport();
      expect(result).toBe(true);
    });

    it("should return false for non-WebP browsers", async () => {
      // Mock Image to simulate WebP not supported
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          // Simulate load error
          setTimeout(() => {
            this.onerror?.();
          }, 0);
        }
      } as any;

      const result = await checkWebPSupport();
      expect(result).toBe(false);
    });

    it("should cache the result after first check", async () => {
      global.Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.width = 1;
            this.height = 1;
            this.onload?.();
          }, 0);
        }
      } as any;

      const firstResult = await checkWebPSupport();
      const secondResult = await checkWebPSupport();

      expect(firstResult).toBe(secondResult);
      expect(secondResult).toBe(true);
    });

    it("should handle image with incorrect dimensions", async () => {
      global.Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.width = 2; // Incorrect width
            this.height = 2; // Incorrect height
            this.onload?.();
          }, 0);
        }
      } as any;

      const result = await checkWebPSupport();
      expect(result).toBe(false);
    });
  });

  describe("isWebPSupported", () => {
    it("should return true by default when not checked yet", () => {
      // Before any check, should return true (modern browser assumption)
      const result = isWebPSupported();
      expect(result).toBe(true);
    });

    it("should return cached value after checkWebPSupport", async () => {
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.onerror?.();
          }, 0);
        }
      } as any;

      await checkWebPSupport();
      const result = isWebPSupported();
      expect(result).toBe(false);
    });
  });

  describe("getOptimalImagePath", () => {
    it("should return PNG path when forceFormat is png", () => {
      const path = "/images/test.png";
      const result = getOptimalImagePath(path, "png");
      expect(result).toBe(path);
    });

    it("should return WebP path when forceFormat is webp", () => {
      const path = "/images/test.png";
      const result = getOptimalImagePath(path, "webp");
      expect(result).toBe("/images/test.webp");
    });

    it("should return WebP path for PNG when WebP is supported", async () => {
      global.Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.width = 1;
            this.height = 1;
            this.onload?.();
          }, 0);
        }
      } as any;

      await checkWebPSupport();

      const path = "/images/test.png";
      const result = getOptimalImagePath(path);
      expect(result).toBe("/images/test.webp");
    });

    it("should return original path for non-PNG files", () => {
      const path = "/images/test.jpg";
      const result = getOptimalImagePath(path);
      expect(result).toBe(path);
    });

    it("should handle uppercase PNG extension", () => {
      const path = "/images/test.PNG";
      const result = getOptimalImagePath(path, "webp");
      expect(result).toBe("/images/test.webp");
    });

    it("should handle mixed case PNG extension", () => {
      const path = "/images/test.PnG";
      const result = getOptimalImagePath(path, "webp");
      expect(result).toBe("/images/test.webp");
    });
  });

  describe("getImageSourceSet", () => {
    it("should return both webp and png paths", () => {
      const path = "/images/test.png";
      const result = getImageSourceSet(path);

      expect(result.webp).toBe("/images/test.webp");
      expect(result.png).toBe("/images/test.png");
    });

    it("should handle uppercase PNG extension", () => {
      const path = "/images/test.PNG";
      const result = getImageSourceSet(path);

      expect(result.webp).toBe("/images/test.webp");
      expect(result.png).toBe("/images/test.PNG");
    });
  });

  describe("initializeImageFormatSupport", () => {
    it("should log success message when WebP is supported", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      global.Image = class MockImage {
        width = 0;
        height = 0;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.width = 1;
            this.height = 1;
            this.onload?.();
          }, 0);
        }
      } as any;

      await initializeImageFormatSupport();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("WebP画像フォーマットがサポートされています")
      );

      consoleLogSpy.mockRestore();
    });

    it("should log warning when WebP is not supported", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;

        set src(_value: string) {
          setTimeout(() => {
            this.onerror?.();
          }, 0);
        }
      } as any;

      await initializeImageFormatSupport();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("WebPがサポートされていません")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
