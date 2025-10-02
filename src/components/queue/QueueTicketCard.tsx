/**
 * Queue Ticket Card - Display queue ticket information
 */
import { QueueStatusBadge } from './QueueStatusBadge';
import { Button } from '@/components/ui/Button';
import type { QueueTicket } from '@/types';

interface QueueTicketCardProps {
  ticket: QueueTicket;
  onCall?: (queueId: string) => void;
  onMarkArrival?: (queueId: string) => void;
  onComplete?: (queueId: string) => void;
  onCancel?: (queueId: string) => void;
  showActions?: boolean;
}

export function QueueTicketCard({
  ticket,
  onCall,
  onMarkArrival,
  onComplete,
  onCancel,
  showActions = true,
}: QueueTicketCardProps) {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const canCall = ticket.status === 'waiting';
  const canMarkArrival = ticket.status === 'notified';
  const canComplete = ticket.status === 'arrived' || ticket.status === 'in_service';
  const canCancel = ['waiting', 'notified', 'arrived'].includes(ticket.status);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">#{ticket.ticketNumber}</h3>
          <p className="text-sm text-gray-500">{formatDate(ticket.createdAt)}</p>
        </div>
        <QueueStatusBadge status={ticket.status} size="lg" />
      </div>

      {/* Position & Time */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-600">Position</div>
          <div className="text-3xl font-bold text-blue-600">{ticket.position}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-600">Est. Wait</div>
          <div className="text-3xl font-bold text-purple-600">{ticket.estimatedWaitTime}m</div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 text-sm">
        {ticket.serviceId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className="font-medium text-gray-900">{ticket.serviceId}</span>
          </div>
        )}
        {ticket.barberId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Barber:</span>
            <span className="font-medium text-gray-900">{ticket.barberId}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span className="font-medium text-gray-900">{formatTime(ticket.createdAt)}</span>
        </div>
        {ticket.arrivedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Arrived:</span>
            <span className="font-medium text-gray-900">{formatTime(ticket.arrivedAt)}</span>
          </div>
        )}
        {ticket.calledAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Called:</span>
            <span className="font-medium text-gray-900">{formatTime(ticket.calledAt)}</span>
          </div>
        )}
        {ticket.completedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Completed:</span>
            <span className="font-medium text-gray-900">{formatTime(ticket.completedAt)}</span>
          </div>
        )}
        {ticket.cancelReason && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cancel Reason:</span>
            <span className="font-medium text-red-600">{ticket.cancelReason}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          {canCall && onCall && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onCall(ticket.queueId)}
              className="flex-1"
            >
              🔔 Call
            </Button>
          )}
          {canMarkArrival && onMarkArrival && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onMarkArrival(ticket.queueId)}
              className="flex-1"
            >
              ✅ Mark Arrival
            </Button>
          )}
          {canComplete && onComplete && (
            <Button
              size="sm"
              variant="success"
              onClick={() => onComplete(ticket.queueId)}
              className="flex-1"
            >
              🎉 Complete
            </Button>
          )}
          {canCancel && onCancel && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => onCancel(ticket.queueId)}
              className="flex-1"
            >
              ❌ Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
