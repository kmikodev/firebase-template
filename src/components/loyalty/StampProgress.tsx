import { CheckCircle2, Circle } from 'lucide-react';

interface StampProgressProps {
  activeStamps: number;
  requiredStamps: number;
  progress: number;
}

export default function StampProgress({ activeStamps, requiredStamps, progress }: StampProgressProps) {
  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="absolute -top-1 right-0 text-xs font-medium text-gray-700 dark:text-gray-300">
          {activeStamps} / {requiredStamps}
        </div>
      </div>

      {/* Stamps Grid */}
      <div className="grid grid-cols-5 gap-3 mt-4">
        {Array.from({ length: requiredStamps }).map((_, index) => {
          const isEarned = index < activeStamps;
          return (
            <div
              key={index}
              className={`
                aspect-square rounded-lg flex items-center justify-center transition-all
                ${isEarned
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 scale-105 shadow-lg'
                  : 'bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600'
                }
              `}
            >
              {isEarned ? (
                <CheckCircle2 className="w-6 h-6 text-white" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 dark:text-gray-600" />
              )}
            </div>
          );
        })}
      </div>

      {/* Message */}
      <div className="text-center">
        {activeStamps >= requiredStamps ? (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            🎉 ¡Tienes una recompensa disponible!
          </p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Te faltan {requiredStamps - activeStamps} sellos para tu próxima recompensa
          </p>
        )}
      </div>
    </div>
  );
}
