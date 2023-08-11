import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';
import { SfuModels, useCallStateHooks } from '@stream-io/video-react-sdk';

import { ScreenShare } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useScreenShareNotification = () => {
  const [screenSharing, setScreenSharing] = useState<{
    name?: string;
    isLocal?: boolean;
    sharing: boolean;
  }>({ sharing: false });

  const { addNotification } = useNotificationContext();
  const { useHasOngoingScreenShare, useLocalParticipant, useParticipants } =
    useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const allParticipants = useParticipants();
  const remoteScreenShare = useHasOngoingScreenShare();

  const localScreenShare = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  useEffect(() => {
    if (
      (remoteScreenShare || localScreenShare) &&
      screenSharing.sharing === false
    ) {
      const firstScreenSharingParticipant = allParticipants.find((p) =>
        p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
      );

      const isLocal =
        firstScreenSharingParticipant?.sessionId ===
        localParticipant?.sessionId;

      const name = isLocal ? 'You' : firstScreenSharingParticipant?.name;
      const message = isLocal
        ? 'You are presenting your screen'
        : `${name} is presenting their screen`;

      setScreenSharing({
        sharing: true,
        name,
        isLocal,
      });

      addNotification({
        id: uuid(),
        message,
        icon: <ScreenShare />,
      });
    }

    if (!remoteScreenShare && !localScreenShare && screenSharing.sharing) {
      const message = screenSharing.isLocal
        ? 'You are no longer presenting your screen'
        : `${screenSharing.name} is no longer presenting their screen`;

      addNotification({
        id: uuid(),
        message: message,
      });
      setScreenSharing({
        sharing: false,
        isLocal: undefined,
        name: undefined,
      });
    }
  }, [remoteScreenShare, localScreenShare, screenSharing]);
};
