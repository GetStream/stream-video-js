import { useEffect, useRef, useState } from 'react';
import './DebugTimestamp.scss';

/**
 * A lightweight overlay that renders a high-precision timestamp for video debugging.
 * Shows UTC wall-clock time (ms) and a monotonic timer from performance.now().
 */
export const DebugTimestamp = () => {
  const [display, setDisplay] = useState('');
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const loop = () => {
      const wall = new Date().toISOString();
      const monoMs = performance.now();
      const epochMs = performance.timeOrigin + monoMs;
      const msg = `${wall} | mono ${monoMs.toFixed(3)}ms | epoch ${epochMs.toFixed(3)}ms`;
      setDisplay(msg);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return <div className="eca__debug-timestamp">{display}</div>;
};
