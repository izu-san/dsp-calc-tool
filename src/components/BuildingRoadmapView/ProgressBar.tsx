import { cn } from "../../utils/classNames";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full h-2 bg-dark-800 rounded-full overflow-hidden", className)}>
      <div
        className="h-full bg-gradient-to-r from-neon-blue to-neon-cyan transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
