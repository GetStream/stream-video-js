import { useEffect, useState } from 'react';
import { interval } from 'rxjs';

/**
 * Custom hook to track the duration in seconds, updating every second.
 *
 * This hook uses RxJS's `interval` to emit values every second and updates the
 * `duration` state accordingly. It starts counting when the component mounts and
 * stops when the component unmounts, ensuring proper cleanup of the subscription
 * to prevent memory leaks.
 *
 * @param {number} startSeconds - The initial number of seconds to start counting from.
 * @returns {number} The current duration in seconds.
 */
export const useDuration = (startSeconds: number = 0): number => {
  const [duration, setDuration] = useState(startSeconds);

  useEffect(() => {
    let subscription = interval(1000).subscribe(() =>
      setDuration((previousDuration) => previousDuration + 1),
    );

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return duration;
};
