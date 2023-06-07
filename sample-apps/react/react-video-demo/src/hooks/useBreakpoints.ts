import { useState, useEffect } from 'react';

const getDeviceConfig = (width: number) => {
  if (width < 320) {
    return 'xs';
  } else if (width >= 320 && width < 768) {
    return 'sm';
  } else if (width >= 768 && width < 1024) {
    return 'md';
  } else if (width >= 1024) {
    return 'lg';
  }
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(() =>
    getDeviceConfig(window.innerWidth),
  );

  useEffect(() => {
    const calcInnerWidth = () =>
      setBreakpoint(getDeviceConfig(window.innerWidth));

    window.addEventListener('resize', calcInnerWidth);
    return () => window.removeEventListener('resize', calcInnerWidth);
  }, []);

  return breakpoint;
};
