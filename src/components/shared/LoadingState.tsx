/**
 * Loading state component with skeleton screens
 */
import { Spinner } from '@/components/ui/Spinner';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
  variant?: 'spinner' | 'skeleton';
}

export function LoadingState({
  message = 'Loading...',
  fullScreen = false,
  variant = 'spinner'
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return <SkeletonLoader fullScreen={fullScreen} />;
  }

  const containerClass = fullScreen
    ? 'flex flex-col items-center justify-center min-h-screen'
    : 'flex flex-col items-center justify-center p-8';

  return (
    <div className={containerClass}>
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
    </div>
  );
}

function SkeletonLoader({ fullScreen }: { fullScreen?: boolean }) {
  const containerClass = fullScreen
    ? 'min-h-screen p-6'
    : 'p-6';

  return (
    <div className={containerClass}>
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
