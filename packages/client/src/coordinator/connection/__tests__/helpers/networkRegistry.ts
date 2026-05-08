type Handler = (event: Event) => void;

/**
 * In-memory replacement for the browser's window online/offline event
 * registration used by NetworkStatusBridge. Lets tests `fireOnline()` and
 * `fireOffline()` without depending on `happy-dom`.
 */
export const createTestNetworkRegistry = () => {
  let handler: Handler | null = null;
  return {
    register: (cb: Handler) => {
      handler = cb;
    },
    unregister: (cb: Handler) => {
      if (handler === cb) handler = null;
    },
    fireOnline: () => handler?.(new Event('online')),
    fireOffline: () => handler?.(new Event('offline')),
    hasHandler: () => handler !== null,
  };
};
