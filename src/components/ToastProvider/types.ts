export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning";
  duration?: number;
}
