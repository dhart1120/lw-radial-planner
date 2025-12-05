import { useState, useEffect } from "react";

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

const reviveDates = (key: string, value: unknown) => {
  if (
    (key === "addedAt" || key === "startAt") &&
    typeof value === "string"
  ) {
    return new Date(value);
  }
  return value;
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = (): T => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      return JSON.parse(item, reviveDates) as T;
    } catch {
      return initialValue;
    }
  };

  const [value, setValueState] = useState<T>(() => readValue());

  const setValue: SetValue<T> = (val) => {
    setValueState((prev) => {
      const newValue =
        typeof val === "function" ? (val as (p: T) => T)(prev) : val;

      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(newValue));
        }
      } catch {
        // ignore write errors
      }

      return newValue;
    });
  };

  useEffect(() => {
    setValueState(readValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return;
      if (event.key !== key) return;

      try {
        if (event.newValue === null) {
          setValueState(initialValue);
        } else {
          setValueState(JSON.parse(event.newValue, reviveDates) as T);
        }
      } catch {
        // ignore parse errors; keep current state
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [key, initialValue]);

  return [value, setValue] as const;
}
