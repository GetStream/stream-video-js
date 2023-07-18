import { useEffect } from 'react';

export const useBeforeUnload = (enabled: boolean, message: string) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: Event) => {
      e.preventDefault(); // <- this does not work even though it's preffered way

      // window.confirm does not work to display custom message
      // @ts-expect-error
      return (e.returnValue = message);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled, message]);
};
