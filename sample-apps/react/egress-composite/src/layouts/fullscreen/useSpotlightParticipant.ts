import { useEffect, useState } from 'react';
import {
  SfuModels,
  StreamVideoParticipant,
  useDominantSpeaker,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import { useAppConfig } from '../../hooks/useAppConfig';

export const useSpotlightParticipant = () => {
  const [speakerInSpotlight, setSpeakerInSpotlight] =
    useState<StreamVideoParticipant>();

  const { spotlightMode } = useAppConfig();
  const dominantSpeaker = useDominantSpeaker();
  const allParticipants = useRemoteParticipants();
  useEffect(() => {
    let shuffleId: NodeJS.Timeout;
    if (spotlightMode === 'shuffle') {
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
  }, [allParticipants, dominantSpeaker, spotlightMode]);

  return speakerInSpotlight;
};
