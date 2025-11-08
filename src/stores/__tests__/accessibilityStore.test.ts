import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAccessibilityStore } from "../../stores/accessibilityStore";

describe("accessibilityStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAccessibilityStore.setState({
      settings: {
        highContrast: false,
        focusIndicatorSize: "medium",
      },
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should have default settings", () => {
    const { settings } = useAccessibilityStore.getState();
    expect(settings.highContrast).toBe(false);
    expect(settings.focusIndicatorSize).toBe("medium");
  });

  it("should update highContrast setting", () => {
    const { setHighContrast } = useAccessibilityStore.getState();
    setHighContrast(true);

    const { settings } = useAccessibilityStore.getState();
    expect(settings.highContrast).toBe(true);
  });

  it("should update focusIndicatorSize setting", () => {
    const { setFocusIndicatorSize } = useAccessibilityStore.getState();
    setFocusIndicatorSize("large");

    const { settings } = useAccessibilityStore.getState();
    expect(settings.focusIndicatorSize).toBe("large");
  });

  it("should persist settings to localStorage", () => {
    const { setHighContrast } = useAccessibilityStore.getState();
    setHighContrast(true);

    const stored = localStorage.getItem("dsp-calculator-accessibility");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored || "{}");
    expect(parsed.state.settings.highContrast).toBe(true);
  });

  it("should reset settings to default", () => {
    const { setHighContrast, setFocusIndicatorSize, resetSettings } =
      useAccessibilityStore.getState();
    setHighContrast(true);
    setFocusIndicatorSize("large");

    resetSettings();

    const { settings } = useAccessibilityStore.getState();
    expect(settings.highContrast).toBe(false);
    expect(settings.focusIndicatorSize).toBe("medium");
  });
});
