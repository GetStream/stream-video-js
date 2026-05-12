import { useEffect } from 'react';

/**
 * This hook is a no-op. Device preference persistence is now handled
 * by the low-level client SDK.
 *
 * @deprecated use the devicePreferences API of the StreamVideoClient.
 */
export const usePersistedDevicePreferences = (key: string = ''): void => {
  useEffect(() => {
    console.warn(
      `usePersistedDevicePreferences is deprecated. Please use the devicePreferences API of the StreamVideoClient instead.`,
    );
  }, [key]);
};
