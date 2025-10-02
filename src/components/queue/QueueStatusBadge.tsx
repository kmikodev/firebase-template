/**
 * Queue Status Badge - Display status with appropriate color
 */
import type { QueueStatus } from '@/types';

interface QueueStatusBadgeProps {
  status: QueueStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function QueueStatusBadge({ status, size = 'md' }: QueueStatusBadgeProps) {
  const getStatusConfig = (status: QueueStatus) => {
    switch (status) {
      case 'waiting':
        return {
          label: 'Waiting',
          icon: '⏳',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'notified':
        return {
          label: 'Notified',
          icon: '🔔',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'arrived':
        return {
          label: 'Arrived',
          icon: '✅',
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'in_service':
        return {
          label: 'In Service',
          icon: '✂️',
          className: 'bg-purple-100 text-purple-800 border-purple-200',
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: '🎉',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          icon: '❌',
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'expired':
        return {
          label: 'Expired',
          icon: '⏰',
          className: 'bg-orange-100 text-orange-800 border-orange-200',
        };
      default:
        return {
          label: status,
          icon: '❓',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-0.5';
      case 'md':
        return 'text-sm px-3 py-1';
      case 'lg':
        return 'text-base px-4 py-1.5';
      default:
        return 'text-sm px-3 py-1';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full border ${config.className} ${sizeClasses}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
