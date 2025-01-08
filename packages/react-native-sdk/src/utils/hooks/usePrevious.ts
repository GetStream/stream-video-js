import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T) => {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef.current;
};
