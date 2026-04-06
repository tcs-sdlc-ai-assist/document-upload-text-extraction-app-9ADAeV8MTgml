import React, { createContext, useContext, type ReactNode } from 'react';
import { useErrorNotification } from '../hooks/useErrorNotification';
import type { ErrorNotification } from '../types';

interface NotificationContextType {
  notifications: ErrorNotification[];
  addNotification: (type: ErrorNotification['type'], message: string) => void;
  removeNotification: (timestamp: number) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { notifications, addNotification, removeNotification, clearAll } =
    useErrorNotification();

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
}

export { NotificationContext };
export type { NotificationContextType };