import { useEffect, useState } from 'react';
import {
  hasVideo,
  StreamVideoParticipant,
  useFilteredParticipants,
} from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../../../ConfigurationContext';

export const useSpotlightParticipant = () => {
  const [speakerInSpotlight, setSpeakerInSpotlight] =
    useState<StreamVideoParticipant>();

  const {
    options: {
      'layout.single-participant.mode': mode,
      'participant.filter': filterParticipants,
    },
  } = useConfigurationContext();

  const participants = useFilteredParticipants({
    excludeLocalParticipant: true,
    filterParticipants,
  });

  useEffect(() => {
    if (mode === 'shuffle') {
      const shuffleId = window.setInterval(() => {
        const randomParticipant =
          participants[Math.floor(Math.random() * participants.length)];
        setSpeakerInSpotlight(randomParticipant);
      }, 3500);

      return () => {
        clearInterval(shuffleId);
      };
    } else {
      const spotlightSpeaker =
        participants.find((p) => p.isDominantSpeaker) ||
        participants.find((p) => hasVideo(p)) ||
        participants[0];

      setSpeakerInSpotlight(spotlightSpeaker);
    }
  }, [participants, mode]);

  return speakerInSpotlight;
};
