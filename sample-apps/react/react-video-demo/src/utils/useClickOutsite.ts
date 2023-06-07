import { useEffect } from 'react';

export function useOnClickOutside(ref: any, handler: any) {
  useEffect(() => {
    const listener = (event: any) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', listener);
    };
  }, [ref, handler]);
}
