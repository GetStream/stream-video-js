import { useEffect, useState } from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../../ConfigurationContext';

export const useSpotlightParticipant = () => {
  const [speakerInSpotlight, setSpeakerInSpotlight] =
    useState<StreamVideoParticipant>();

  const { useDominantSpeaker, useRemoteParticipants } = useCallStateHooks();
  const {
    options: { layout: { mode } = {} },
  } = useConfigurationContext();
  const dominantSpeaker = useDominantSpeaker();
  const allParticipants = useRemoteParticipants();
  useEffect(() => {
    let shuffleId: NodeJS.Timeout;
    if (mode === 'shuffle') {
      shuffleId = setInterval(() => {
        const randomParticipant =
          allParticipants[Math.floor(Math.random() * allParticipants.length)];
        setSpeakerInSpotlight(randomParticipant);
      }, 3500);
    } else {
      const spotlightSpeaker =
        dominantSpeaker ||
        allParticipants.find((p) =>
          p.publishedTracks.includes(SfuModels.TrackType.VIDEO),
        ) ||
        allParticipants[0];

      setSpeakerInSpotlight(spotlightSpeaker);
    }
    return () => {
      clearInterval(shuffleId);
    };
  }, [allParticipants, dominantSpeaker, mode]);

  return speakerInSpotlight;
};
