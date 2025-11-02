import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import * as Toast from "@radix-ui/react-toast";
import { ToastContext } from "./ToastContext";
import type { ToastData } from "./types";
import "./ToastProvider.css";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback(
    (
      title: string,
      description?: string,
      variant: ToastData["variant"] = "info",
      duration: number = 5000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = {
        id,
        title,
        description,
        variant,
        duration,
      };

      setToasts(prev => [...prev, newToast]);

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 &&
        createPortal(
          <Toast.Provider swipeDirection="right">
            {toasts.map(toast => (
              <Toast.Root
                key={toast.id}
                className={`toast-root toast-${toast.variant}`}
                duration={toast.duration}
                onOpenChange={open => {
                  if (!open) {
                    removeToast(toast.id);
                  }
                }}
              >
                <Toast.Title className="toast-title">{toast.title}</Toast.Title>
                {toast.description && (
                  <Toast.Description className="toast-description">
                    {toast.description}
                  </Toast.Description>
                )}
                <Toast.Close className="toast-close" aria-label="Close">
                  ×
                </Toast.Close>
              </Toast.Root>
            ))}
            <Toast.Viewport className="toast-viewport" />
          </Toast.Provider>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
