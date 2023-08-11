import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';

import {
  createSoundDetector,
  SfuModels,
  useCallStateHooks,
  useMediaDevices,
} from '@stream-io/video-react-sdk';

import { MicMuted } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useSpeakingWhileMutedNotification = () => {
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const { getAudioStream } = useMediaDevices();

  const { addNotification } = useNotificationContext();

  const isAudioMute = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const audioDeviceId = localParticipant?.audioDeviceId;
  const [isSpeakingWhileMuted, setIsSpeakingWhileMuted] = useState(false);

  useEffect(() => {
    if (!isAudioMute) return;

    const disposeSoundDetector = getAudioStream({
      deviceId: audioDeviceId,
    }).then((audioStream) =>
      createSoundDetector(audioStream, ({ isSoundDetected }) => {
        setIsSpeakingWhileMuted(isSoundDetected);
      }),
    );
    disposeSoundDetector.catch((err) => {
      console.error('Error while creating sound detector', err);
    });

    return () => {
      disposeSoundDetector
        .then((dispose) => dispose())
        .catch((err) => {
          console.error('Error while disposing sound detector', err);
        });
      setIsSpeakingWhileMuted(false);
    };
  }, [audioDeviceId, getAudioStream, isAudioMute]);

  useEffect(() => {
    if (!isSpeakingWhileMuted) return;

    addNotification({
      id: uuid(),
      message: 'You are speaking while muted',
      icon: <MicMuted />,
    });

    const timeout = setTimeout(() => {
      setIsSpeakingWhileMuted(false);
    }, 5500);

    return () => {
      clearTimeout(timeout);
      setIsSpeakingWhileMuted(false);
    };
  }, [isSpeakingWhileMuted]);
};
