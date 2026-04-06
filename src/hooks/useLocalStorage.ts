import { useState, useCallback, useEffect } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

function readFromStorage<T>(key: string, initialValue: T): T {
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return initialValue;
    }
    return JSON.parse(item) as T;
  } catch {
    console.error(`useLocalStorage: Error reading key "${key}" from localStorage.`);
    return initialValue;
  }
}

function writeToStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(`useLocalStorage: Storage quota exceeded when writing key "${key}".`);
    } else {
      console.error(`useLocalStorage: Error writing key "${key}" to localStorage.`, error);
    }
  }
}

function removeFromStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    console.error(`useLocalStorage: Error removing key "${key}" from localStorage.`);
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, SetValue<T>, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readFromStorage(key, initialValue),
  );

  const setValue: SetValue<T> = useCallback(
    (value) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        writeToStorage(key, nextValue);
        return nextValue;
      });
    },
    [key],
  );

  const removeValue = useCallback(() => {
    removeFromStorage(key);
    setStoredValue(initialValue);
  }, [key, initialValue]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        if (event.newValue === null) {
          setStoredValue(initialValue);
        } else {
          try {
            setStoredValue(JSON.parse(event.newValue) as T);
          } catch {
            console.error(
              `useLocalStorage: Error parsing storage event for key "${key}".`,
            );
            setStoredValue(initialValue);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;