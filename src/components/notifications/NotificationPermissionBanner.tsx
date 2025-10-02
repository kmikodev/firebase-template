/**
 * Notification Permission Banner
 *
 * Shows a banner prompting user to enable push notifications
 * Appears when notifications are not enabled
 */

import { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getFCMToken
} from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationPermissionBanner() {
  const { firebaseUser } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    if (!isNotificationSupported()) {
      setIsDismissed(true);
      return;
    }

    // Check current permission status
    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Check if user dismissed before
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    if (!firebaseUser || firebaseUser.isAnonymous) {
      alert('Debes iniciar sesión con una cuenta para recibir notificaciones');
      return;
    }

    setIsRequesting(true);
    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        // Get FCM token
        await getFCMToken(firebaseUser.uid);
        console.log('Notifications enabled successfully');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  // Don't show banner if:
  // - User dismissed it
  // - Permission already granted
  // - Permission denied
  // - User is not logged in or is anonymous
  if (
    isDismissed ||
    permission === 'granted' ||
    permission === 'denied' ||
    !firebaseUser ||
    firebaseUser.isAnonymous
  ) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-blue-100">
              <Bell className="h-6 w-6 text-blue-600" />
            </span>
            <p className="ml-3 font-medium text-blue-900">
              <span className="md:hidden">
                Activa las notificaciones
              </span>
              <span className="hidden md:inline">
                Recibe notificaciones cuando sea tu turno en la cola
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium transition text-sm"
            >
              {isRequesting ? 'Activando...' : 'Activar Notificaciones'}
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-blue-100 transition"
            >
              <X className="h-5 w-5 text-blue-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
