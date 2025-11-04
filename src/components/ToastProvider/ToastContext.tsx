import { createContext } from "react";
import type { ToastData } from "./types";

export interface ToastContextValue {
  showToast: (
    title: string,
    description?: string,
    variant?: ToastData["variant"],
    duration?: number
  ) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
