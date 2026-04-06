import { useState, useCallback, useRef, useEffect } from 'react';
import { NOTIFICATION_DURATION_MS } from '../constants';
import type { ErrorNotification } from '../types';

interface UseErrorNotificationReturn {
  notifications: ErrorNotification[];
  addNotification: (type: ErrorNotification['type'], message: string) => void;
  removeNotification: (timestamp: number) => void;
  clearAll: () => void;
}

export function useErrorNotification(): UseErrorNotificationReturn {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeNotification = useCallback((timestamp: number) => {
    const timer = timersRef.current.get(timestamp);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(timestamp);
    }
    setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  }, []);

  const addNotification = useCallback(
    (type: ErrorNotification['type'], message: string) => {
      const timestamp = Date.now();
      const notification: ErrorNotification = { type, message, timestamp };

      setNotifications((prev) => [...prev, notification]);

      const timer = setTimeout(() => {
        timersRef.current.delete(timestamp);
        setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
      }, NOTIFICATION_DURATION_MS);

      timersRef.current.set(timestamp, timer);
    },
    [],
  );

  const clearAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setNotifications([]);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  return { notifications, addNotification, removeNotification, clearAll };
}