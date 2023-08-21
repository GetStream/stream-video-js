import { useEffect, useState, useCallback } from 'react';

export const useBrowserMediaPermissions = (
  contraints: { audio: boolean; video: boolean } = { audio: true, video: true },
): {
  isAwaitingPermission: boolean;
  hasBrowserMediaPermissions: boolean;
} => {
  const [isAwaitingPermission, setIsAwaitingPermission] = useState(false);
  const [hasBrowserMediaPermissions, setBrowserMediaPermissions] =
    useState(false);

  const requestMediaPermissions = useCallback(async () => {
    if (hasBrowserMediaPermissions || navigator === undefined) return;

    const resetAwaitingPermission = () => setIsAwaitingPermission(false);

    try {
      await navigator.mediaDevices
        .getUserMedia(contraints)
        .then((stream: MediaStream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          resetAwaitingPermission();
          setBrowserMediaPermissions(true);
        })
        .catch(() => {
          resetAwaitingPermission();
        });
    } catch (error) {
      resetAwaitingPermission();
      throw new Error(`Request browser media permission failed: ${error}`);
    }
  }, [contraints, hasBrowserMediaPermissions]);

  useEffect(() => {
    if (isAwaitingPermission || hasBrowserMediaPermissions) return;

    setIsAwaitingPermission(true);
    requestMediaPermissions();
  }, [
    contraints,
    isAwaitingPermission,
    setBrowserMediaPermissions,
    requestMediaPermissions,
    hasBrowserMediaPermissions,
  ]);

  return {
    isAwaitingPermission,
    hasBrowserMediaPermissions,
  };
};
