import { useEffect, useState } from 'react';

/**
 * this is a custom hook that takes a value and a delay and returns a debounced value
 * @param {T} value
 * @param {number} delay
 * @returns {T}
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
