import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={clsx(
          "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed hover:transform hover:-translate-y-0.5",
          {
            // Variants
            "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg": 
              variant === "primary",
            "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100": 
              variant === "secondary",
            "bg-transparent border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-gray-900": 
              variant === "outline",
            "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800": 
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg": 
              variant === "danger",
            
            // Sizes
            "px-4 py-2 text-sm": size === "sm",
            "px-6 py-3 text-base": size === "md",
            "px-8 py-4 text-lg": size === "lg",
            
            // Full width
            "w-full": fullWidth,
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";
