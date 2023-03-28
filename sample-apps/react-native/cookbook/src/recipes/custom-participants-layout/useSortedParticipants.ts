import {useParticipants} from '@stream-io/video-react-native-sdk';
import {useSpotlightParticipant} from './useSpotlightParticipant';
import {hasAudio, hasScreenShare, hasVideo} from './utils';

/**
 * Sorts participants so that:
 * - the presenter is first,
 * - the dominant speaker is next,
 * - then video, then audio, then the rest.
 */
export const useSortedParticipants = () => {
  const participantInSpotlight = useSpotlightParticipant();

  // console.log('otherParticipants', otherParticipants);
  // we filter out the participant in spotlight if they are not sharing screen
  const allParticipants = useParticipants();
  console.log('allParticipants', allParticipants);

  const participants = allParticipants.filter(p => {
    return (
      hasScreenShare(participantInSpotlight) || p !== participantInSpotlight
    );
  });

  const presenters = participants.filter(p => hasScreenShare(p));
  const videoAndAudioParticipants = participants.filter(
    p => hasVideo(p) && hasAudio(p),
  );
  const videoOnlyParticipants = participants.filter(
    p => hasVideo(p) && !hasAudio(p),
  );
  const audioOnlyParticipants = participants.filter(
    p => !hasVideo(p) && hasAudio(p),
  );
  const muteParticipants = participants.filter(
    p => !hasVideo(p) && !hasAudio(p),
  );

  return [
    participantInSpotlight,
    ...presenters,
    ...videoAndAudioParticipants,
    ...videoOnlyParticipants,
    ...audioOnlyParticipants,
    ...muteParticipants,
  ];
};
