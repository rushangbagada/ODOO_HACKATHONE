export function LoadingSpinner({ size = "md", fullScreen = false }: { size?: "sm" | "md" | "lg"; fullScreen?: boolean }) {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-4",
    lg: "w-16 h-16 border-4",
  };

  const spinner = (
    <div className="text-center">
      <div className={`${sizeClasses[size]} border-indigo-200 border-t-indigo-600 dark:border-gray-700 dark:border-t-indigo-400 rounded-full animate-spin mx-auto`}></div>
      <p className="text-gray-600 dark:text-gray-400 mt-4 text-sm font-medium">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-indigo-100 dark:border-gray-700 rounded-full"></div>
          {/* Main spinner */}
          <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          {/* Inner pulsing circle */}
          <div className="absolute inset-2 bg-indigo-50 dark:bg-gray-800 rounded-full animate-pulse"></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full"></div>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-gray-900 dark:text-white text-lg font-semibold">Loading</p>
          <div className="flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
