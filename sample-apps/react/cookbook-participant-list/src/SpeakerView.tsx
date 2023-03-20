import { PropsWithChildren, useMemo } from 'react';
import {
  CancelCallButton,
  ParticipantBox,
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
              <ParticipantBox
                participant={participant}
                call={call}
                // mute the local participant,
                // as we don't want to hear ourselves
                isMuted={participant.isLoggedInUser}
              />
            </div>
          ))}
        </div>
      )}

      <div className="spotlight">
        {participantInSpotlight && (
          <ParticipantBox participant={participantInSpotlight} call={call} />
        )}
      </div>

      <CustomCallControls>
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
 * - the dominant speaker is first,
 * - then video, then audio, then the rest.
 */
export const useSortedParticipants = () => {
  const participantInSpotlight = useSpotlightParticipant();
  const participants = useParticipants();
  const otherParticipants = useMemo(() => {
    return participants

      .filter((p) => p !== participantInSpotlight)
      .sort((a, b) => {
        if (hasScreenShare(a) && !hasScreenShare(b)) return -1;
        if (!hasScreenShare(a) && hasScreenShare(b)) return 1;

        if (
          (hasVideo(a) && hasAudio(a) && !hasVideo(b) && !hasAudio(b)) ||
          (hasVideo(a) && !hasAudio(a) && !hasVideo(b) && hasAudio(b))
        )
          return -1;

        if (!hasVideo(a) && !hasAudio(a) && hasVideo(b) && hasAudio(b))
          return 1;

        return 0;
      });
  }, [participants, participantInSpotlight]);

  return [participantInSpotlight, ...otherParticipants];
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
