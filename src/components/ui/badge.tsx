import { HTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "error" | "info" | "accent" | "default";
  size?: "sm" | "md" | "lg";
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-semibold rounded-full",
          {
            // Variants
            "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400": variant === "success",
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400": variant === "warning",
            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400": variant === "error",
            "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400": variant === "info",
            "bg-[var(--color-accent)] text-[var(--color-dark)]": variant === "accent",
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300": variant === "default",
            
            // Sizes
            "px-2 py-0.5 text-xs": size === "sm",
            "px-3 py-1 text-sm": size === "md",
            "px-4 py-1.5 text-base": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
