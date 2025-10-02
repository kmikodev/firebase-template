/**
 * Notification History Component
 *
 * Displays user's notification history from Firestore
 */

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface NotificationDocument {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Timestamp;
}

export function NotificationHistory() {
  const { firebaseUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Real-time listener for notifications
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', firebaseUser.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        notificationId: doc.id,
        ...doc.data()
      })) as NotificationDocument[];

      setNotifications(notifs);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ticket_confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'your_turn':
        return <Bell className="h-5 w-5 text-blue-600" />;
      case 'queue_warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay notificaciones
        </h3>
        <p className="text-gray-500">
          Aquí aparecerán tus notificaciones de turnos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Notificaciones
      </h3>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.notificationId}
            className={`p-4 rounded-lg border transition ${
              notification.read
                ? 'bg-white border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.body}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDate(notification.createdAt)}
                </p>
              </div>

              {!notification.read && (
                <div className="flex-shrink-0">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
