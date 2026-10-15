import { useEffect, useReducer, useState } from 'react';
import { initialWwsdState, wwsdReducer } from './reducer';
import type { WwsdEvent } from './types';

export type FeedStatus = 'connecting' | 'live' | 'reconnecting';

const MAX_BACKOFF_MS = 10_000;

/**
 * Subscribes to `ws /calls/{id}/events`. The server replays the call's full
 * history on every connect, so state is rebuilt from scratch on each open.
 */
export const useWwsdFeed = (eventsUrl: string) => {
  const [state, dispatch] = useReducer(wwsdReducer, initialWwsdState);
  const [status, setStatus] = useState<FeedStatus>('connecting');

  useEffect(() => {
    let socket: WebSocket | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let disposed = false;

    const scheduleRetry = () => {
      setStatus('reconnecting');
      const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt);
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      try {
        socket = new WebSocket(eventsUrl);
      } catch (err) {
        console.warn('[wwsd] cannot open the events socket', err);
        scheduleRetry();
        return;
      }
      socket.onopen = () => {
        attempt = 0;
        dispatch({ kind: 'reset' });
        setStatus('live');
      };
      socket.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data) as WwsdEvent;
          if (typeof event?.type === 'string') {
            dispatch({ kind: 'event', event });
          }
        } catch (err) {
          console.warn('[wwsd] dropped a malformed event', err);
        }
      };
      socket.onclose = () => {
        if (disposed) return;
        scheduleRetry();
      };
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      socket?.close();
    };
  }, [eventsUrl]);

  return { state, status };
};
