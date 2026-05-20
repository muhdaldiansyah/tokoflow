// app/components/ui/loading.js
export function LoadingSpinner({ size = "default" }) {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-gray-900 ${sizeClasses[size]}`}></div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  );
}