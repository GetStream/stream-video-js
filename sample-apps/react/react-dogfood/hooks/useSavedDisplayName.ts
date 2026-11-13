import { useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';

const DISPLAY_NAME_KEY = '@pronto/display-name';

/**
 * Returns the display name last picked in this browser, or `undefined`.
 */
export const getSavedDisplayName = () => {
  if (typeof window === 'undefined') return undefined;
  try {
    return window.localStorage.getItem(DISPLAY_NAME_KEY) || undefined;
  } catch {
    return undefined;
  }
};

/**
 * The display name picked last time. Demo account sessions carry it in their
 * session token, and it is also kept in this browser, so it outlives the
 * session and pre-fills the next sign-in.
 */
export const useSavedDisplayName = () => {
  const { data: session, update } = useSession();
  const [storedName, setStoredName] = useState(getSavedDisplayName);

  const saveDisplayName = useCallback(
    async (name: string) => {
      setStoredName(name);
      try {
        window.localStorage.setItem(DISPLAY_NAME_KEY, name);
      } catch {
        // The session still keeps the name if storage is unavailable.
      }
      if (session?.user && !session.user.stream && session.user.name !== name) {
        await update({ name });
      }
    },
    [session, update],
  );

  return {
    savedDisplayName: session?.user?.name ?? storedName,
    saveDisplayName,
  };
};
