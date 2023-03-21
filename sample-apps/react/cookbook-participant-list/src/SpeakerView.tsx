import { PropsWithChildren, useMemo } from 'react';
import {
  CancelCallButton,
  ParticipantBox,
  ScreenShareButton,
  SfuModels,
  SpeakingWhileMutedNotification,
  StreamVideoParticipant,
  ToggleAudioPublishingButton,
  ToggleCameraPublishingButton,
  useCall,
  useDominantSpeaker,
  useParticipants,
} from '@stream-io/video-react-sdk';

import './SpeakerView.scss';

export const SpeakerView = () => {
  const call = useCall()!;
  const [participantInSpotlight, ...otherParticipants] =
    useSortedParticipants();
  return (
    <div className="speaker-view">
      {otherParticipants.length > 0 && (
        <div className="participants-bar">
          {otherParticipants.map((participant) => (
            <div className="participant-tile" key={participant.sessionId}>
              <ParticipantBox participant={participant} call={call} />
            </div>
          ))}
        </div>
      )}

      <div className="spotlight">
        {participantInSpotlight && (
          <ParticipantBox
            participant={participantInSpotlight}
            call={call}
            videoKind={
              hasScreenShare(participantInSpotlight) ? 'screen' : 'video'
            }
          />
        )}
      </div>

      <CustomCallControls>
        <ScreenShareButton call={call} />
        <SpeakingWhileMutedNotification>
          <ToggleAudioPublishingButton />
        </SpeakingWhileMutedNotification>
        <ToggleCameraPublishingButton />
        <CancelCallButton
          call={call}
          onLeave={() => {
            console.log('onLeave callback called');
          }}
        />
      </CustomCallControls>
    </div>
  );
};

const CustomCallControls = ({ children }: PropsWithChildren<{}>) => {
  return <div className="str-video__call-controls">{children}</div>;
};

/**
 * Sorts participants so that:
 * - the presenter is first,
 * - the dominant speaker is next,
 * - then video, then audio, then the rest.
 */
export const useSortedParticipants = () => {
  const participantInSpotlight = useSpotlightParticipant();

  // we filter out the participant in spotlight if they are not sharing screen
  const allParticipants = useParticipants();
  const participants = allParticipants.filter((p) => {
    return (
      hasScreenShare(participantInSpotlight) || p !== participantInSpotlight
    );
  });

  const presenters = participants.filter((p) => hasScreenShare(p));
  const videoAndAudioParticipants = participants.filter(
    (p) => hasVideo(p) && hasAudio(p),
  );
  const videoOnlyParticipants = participants.filter(
    (p) => hasVideo(p) && !hasAudio(p),
  );
  const audioOnlyParticipants = participants.filter(
    (p) => !hasVideo(p) && hasAudio(p),
  );
  const muteParticipants = participants.filter(
    (p) => !hasVideo(p) && !hasAudio(p),
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
        (p) => hasScreenShare(p) || (hasVideo(p) && hasAudio(p)),
      ) ||
      participants[0]
    );
  }, [participants, dominantSpeaker]);
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

const hasVideo = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.VIDEO);

const hasAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.AUDIO);
