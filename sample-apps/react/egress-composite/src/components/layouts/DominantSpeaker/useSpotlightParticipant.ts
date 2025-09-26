import { useEffect, useState } from 'react';
import {
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
    if (mode !== 'shuffle') return;

    const shuffleId = window.setInterval(() => {
      const randomParticipant =
        participants[Math.floor(Math.random() * participants.length)];
      setSpeakerInSpotlight(randomParticipant);
    }, 3500);

    return () => {
      clearInterval(shuffleId);
      setSpeakerInSpotlight(undefined);
    };
  }, [participants, mode]);

  return speakerInSpotlight ?? participants[0];
};
