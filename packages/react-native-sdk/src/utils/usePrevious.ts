import { useEffect, useRef } from 'react';

export const usePrevious = (value: any) => {
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return valueRef.current;
};
