import { PropsWithChildren, useEffect } from 'react';
import {
  CancelCallButton,
  combineComparators,
  Comparator,
  conditional,
  DefaultParticipantViewUI,
  dominantSpeaker,
  ParticipantView,
  pinned,
  publishingAudio,
  publishingVideo,
  reactionType,
  ScreenShareButton,
  screenSharing,
  SfuModels,
  speaking,
  SpeakingWhileMutedNotification,
  StreamVideoParticipant,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useParticipants,
  VisibilityState,
} from '@stream-io/video-react-sdk';

import './SpeakerView.scss';

export const SpeakerView = () => {
  const call = useCall();
  const [participantInSpotlight, ...otherParticipants] = useParticipants();

  // determine whether the call is a 1:1 call
  const isOneToOneCall = otherParticipants.length === 1;
  useEffect(() => {
    if (!call) return;
    const customSortingPreset = getCustomSortingPreset(isOneToOneCall);
    call.setSortParticipantsBy(customSortingPreset);
  }, [call, isOneToOneCall]);

  return (
    <div className="speaker-view">
      {call && otherParticipants.length > 0 && (
        <div className="participants-bar">
          {otherParticipants.map((participant) => (
            <div className="participant-tile" key={participant.sessionId}>
              <ParticipantView
                participant={participant}
                ParticipantViewUI={DefaultParticipantViewUI}
              />
            </div>
          ))}
        </div>
      )}

      <div className="spotlight">
        {call && participantInSpotlight && (
          <ParticipantView
            participant={participantInSpotlight}
            videoKind={
              hasScreenShare(participantInSpotlight) ? 'screen' : 'video'
            }
            ParticipantViewUI={DefaultParticipantViewUI}
          />
        )}
      </div>

      <CustomCallControls>
        <ScreenShareButton />
        <SpeakingWhileMutedNotification>
          <ToggleAudioPublishingButton />
        </SpeakingWhileMutedNotification>
        <ToggleVideoPublishingButton />
        {call && (
          <CancelCallButton
            onLeave={() => {
              console.log('onLeave callback called');
            }}
          />
        )}
      </CustomCallControls>
    </div>
  );
};

const CustomCallControls = ({ children }: PropsWithChildren<{}>) => {
  return <div className="str-video__call-controls">{children}</div>;
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

/**
 * Creates a custom sorting preset for the participants list.
 *
 * This function supports two modes:
 *
 * 1) 1:1 calls, where we want to always show the other participant in the spotlight,
 *  and not show them in the participants bar.
 *
 * 2) group calls, where we want to show the participants in the participants bar
 *  in a custom order:
 *  - screen sharing participants
 *  - dominant speaker
 *  - pinned participants
 *  - participants who are speaking
 *  - participants who have raised their hand
 *  - participants who are publishing video and audio
 *  - participants who are publishing video
 *  - participants who are publishing audio
 *  - other participants
 *
 * @param isOneToOneCall whether the call is a 1:1 call.
 */
const getCustomSortingPreset = (
  isOneToOneCall: boolean = false,
): Comparator<StreamVideoParticipant> => {
  // 1:1 calls are a special case, where we want to always show the other
  // participant in the spotlight, and not show them in the participants bar.
  if (isOneToOneCall) {
    return (a: StreamVideoParticipant, b: StreamVideoParticipant) => {
      if (a.isLoggedInUser) return 1;
      if (b.isLoggedInUser) return -1;
      return 0;
    };
  }

  // a comparator decorator which applies the decorated comparator only if the
  // participant is invisible.
  // This ensures stable sorting when all participants are visible.
  const ifInvisibleBy = conditional(
    (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
      a.viewportVisibilityState === VisibilityState.INVISIBLE ||
      b.viewportVisibilityState === VisibilityState.INVISIBLE,
  );

  // the custom sorting preset
  return combineComparators(
    screenSharing,
    dominantSpeaker,
    pinned,
    ifInvisibleBy(speaking),
    ifInvisibleBy(reactionType('raised-hand')),
    ifInvisibleBy(publishingVideo),
    ifInvisibleBy(publishingAudio),
  );
};
