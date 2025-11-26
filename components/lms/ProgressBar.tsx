'use client';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  color?: 'blue' | 'emerald' | 'yellow' | 'red' | 'purple';
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  progress,
  size = 'md',
  showPercentage = true,
  color = 'blue',
  animated = false,
  className = ''
}: ProgressBarProps) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500'
  };

  const textColorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600'
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      {showPercentage && (
        <span className={`ml-3 text-sm font-medium ${textColorClasses[color]}`}>
          {Math.round(normalizedProgress)}%
        </span>
      )}
    </div>
  );
}
