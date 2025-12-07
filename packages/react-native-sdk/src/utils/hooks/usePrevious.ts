import { useEffect, useRef } from 'react';

export const usePrevious = <T>(value: T) => {
  'use no memo';
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef.current;
};
