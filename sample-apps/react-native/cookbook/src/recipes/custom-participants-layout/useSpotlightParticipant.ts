import {useMemo} from 'react';
import {
  useDominantSpeaker,
  useParticipants,
} from '@stream-io/video-react-native-sdk';
import {hasAudio, hasScreenShare, hasVideo} from './utils';

/**
 * Returns the participant to be shown in the spotlight.
 * Usually this is the dominant speaker, but if there is no dominant speaker,
 * then it's the first participant with screen share or video and audio.
 */
export const useSpotlightParticipant = () => {
  const participants = useParticipants();
  const dominantSpeaker = useDominantSpeaker();
  return useMemo(() => {
    return (
      dominantSpeaker ||
      participants.find(
        p => hasScreenShare(p) || (hasVideo(p) && hasAudio(p)),
      ) ||
      participants[0]
    );
  }, [participants, dominantSpeaker]);
};
