import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import type { ErrorNotification } from '../types';

const typeStyles: Record<ErrorNotification['type'], { container: string; icon: string; iconPath: string }> = {
  error: {
    container: 'bg-error-50 border-error-500 text-error-700',
    icon: 'text-error-500',
    iconPath:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
  },
  success: {
    container: 'bg-success-50 border-success-500 text-success-700',
    icon: 'text-success-500',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    container: 'bg-warning-50 border-warning-500 text-warning-700',
    icon: 'text-warning-500',
    iconPath:
      'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  },
  info: {
    container: 'bg-primary-50 border-primary-500 text-primary-700',
    icon: 'text-primary-500',
    iconPath:
      'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
  },
};

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: ErrorNotification;
  onDismiss: (timestamp: number) => void;
}) {
  const styles = typeStyles[notification.type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border-l-4 p-4 shadow-card animate-slide-down ${styles.container}`}
    >
      <svg
        className={`h-5 w-5 flex-shrink-0 ${styles.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={styles.iconPath}
        />
      </svg>

      <p className="flex-1 text-sm font-medium">{notification.message}</p>

      <button
        type="button"
        onClick={() => onDismiss(notification.timestamp)}
        className="flex-shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
        aria-label="Dismiss notification"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3"
    >
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.timestamp}
          notification={notification}
          onDismiss={removeNotification}
        />
      ))}
    </div>
  );
}

export default NotificationToast;