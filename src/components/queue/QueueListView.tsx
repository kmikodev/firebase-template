/**
 * Queue List View - Display queue tickets in table format
 */
import { QueueStatusBadge } from './QueueStatusBadge';
import { Button } from '@/components/ui/Button';
import type { QueueTicket } from '@/types';

interface QueueListViewProps {
  tickets: QueueTicket[];
  onCall?: (queueId: string) => void;
  onMarkArrival?: (queueId: string) => void;
  onComplete?: (queueId: string) => void;
  onCancel?: (queueId: string) => void;
  showActions?: boolean;
}

export function QueueListView({
  tickets,
  onCall,
  onMarkArrival,
  onComplete,
  onCancel,
  showActions = true,
}: QueueListViewProps) {
  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getActions = (ticket: QueueTicket) => {
    const canCall = ticket.status === 'waiting';
    const canMarkArrival = ticket.status === 'notified';
    const canComplete = ticket.status === 'arrived' || ticket.status === 'in_service';
    const canCancel = ['waiting', 'notified', 'arrived'].includes(ticket.status);

    return { canCall, canMarkArrival, canComplete, canCancel };
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Est. Wait
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Barber
              </th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => {
              const actions = getActions(ticket);

              return (
                <tr key={ticket.queueId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-gray-900">
                      #{ticket.ticketNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-2xl font-bold text-blue-600">
                      {ticket.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <QueueStatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-purple-600">
                      {ticket.estimatedWaitTime}m
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTime(ticket.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ticket.serviceId || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ticket.barberId || '-'}
                    </div>
                  </td>
                  {showActions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {actions.canCall && onCall && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => onCall(ticket.queueId)}
                            title="Call ticket"
                          >
                            🔔
                          </Button>
                        )}
                        {actions.canMarkArrival && onMarkArrival && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => onMarkArrival(ticket.queueId)}
                            title="Mark arrival"
                          >
                            ✅
                          </Button>
                        )}
                        {actions.canComplete && onComplete && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => onComplete(ticket.queueId)}
                            title="Complete service"
                          >
                            🎉
                          </Button>
                        )}
                        {actions.canCancel && onCancel && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => onCancel(ticket.queueId)}
                            title="Cancel ticket"
                          >
                            ❌
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
