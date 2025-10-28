import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializes with light mode by default", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("initializes from localStorage if available", () => {
    localStorage.setItem("darkMode", "true");

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggles dark mode on and off", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDarkMode).toBe(false);

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("darkMode")).toBe("true");

    act(() => {
      result.current.toggleTheme();
    });

    expect(result.current.isDarkMode).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("darkMode")).toBe("false");
  });

  it("saves dark mode state to localStorage", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(localStorage.getItem("darkMode")).toBe("true");
  });

  it("applies dark class to document root when dark mode is enabled", () => {
    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class from document root when dark mode is disabled", () => {
    localStorage.setItem("darkMode", "true");
    const { result } = renderHook(() => useTheme());

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.toggleTheme();
    });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
