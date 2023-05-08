import { useEffect, useState } from 'react';

import {
  CallTypes,
  combineComparators,
  Comparator,
  defaultSortPreset,
  screenSharing,
  SfuModels,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import {
  useCall,
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-bindings';

import { ParticipantBox } from '../ParticipantBox';
import { IconButton } from '../../../components';
import { useHorizontalScrollPosition } from '../../../components/StreamCall/hooks';

export const SpeakerLayout = () => {
  const call = useCall();
  const [participantInSpotlight, ...otherParticipants] = useParticipants();
  const [scrollWrapper, setScrollWrapper] = useState<HTMLDivElement | null>(
    null,
  );
  const isOneOnOneCall = otherParticipants.length === 1;
  const localParticipant = useLocalParticipant();

  const scrollPosition = useHorizontalScrollPosition(scrollWrapper);

  const scrollStartClickHandler = () => {
    scrollWrapper?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollEndClickHandler = () => {
    scrollWrapper?.scrollBy({ left: 150, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!scrollWrapper || !call) return;

    const cleanup = call.viewportTracker.setViewport(scrollWrapper);

    return () => cleanup();
  }, [scrollWrapper, call]);

  useEffect(() => {
    if (!call) return;
    // always show the remote participant in the spotlight
    if (isOneOnOneCall) {
      call.setSortParticipantsBy(combineComparators(screenSharing, loggedIn));
    } else {
      call.setSortParticipantsBy(speakerLayoutSortPreset);
    }

    return () => {
      // reset the sorting to the default for the call type
      const callConfig = CallTypes.get(call.type);
      call.setSortParticipantsBy(
        callConfig.options.sortParticipantsBy || defaultSortPreset,
      );
    };
  }, [call, isOneOnOneCall]);

  const isSpeakerScreenSharing = hasScreenShare(participantInSpotlight);
  return (
    <div className="str-video__speaker-layout--wrapper">
      <div className="str-video__speaker-layout">
        <div className="str-video__speaker-layout--spotlight">
          {call && participantInSpotlight && (
            <ParticipantBox
              participant={participantInSpotlight}
              call={call}
              muteAudio={isSpeakerScreenSharing}
              videoKind={isSpeakerScreenSharing ? 'screen' : 'video'}
              sinkId={localParticipant?.audioOutputDeviceId}
            />
          )}
        </div>
        {otherParticipants.length > 0 && (
          <div className="str-video__speaker-layout--participants-bar-buttons-wrapper">
            {scrollPosition && scrollPosition !== 'start' && (
              <IconButton
                onClick={scrollStartClickHandler}
                icon="caret-left"
                className="str-video__speaker-layout--participants-bar-button-left"
              />
            )}
            <div
              className="str-video__speaker-layout--participants-bar-wrapper"
              ref={setScrollWrapper}
            >
              <div className="str-video__speaker-layout--participants-bar">
                {call && isSpeakerScreenSharing && (
                  <div
                    className="str-video__speaker-layout--participant-tile"
                    key={participantInSpotlight.sessionId}
                  >
                    <ParticipantBox
                      participant={participantInSpotlight}
                      call={call}
                      sinkId={localParticipant?.audioOutputDeviceId}
                      toggleMenuPosition="top"
                    />
                  </div>
                )}
                {call &&
                  otherParticipants.map((participant) => (
                    <div
                      className="str-video__speaker-layout--participant-tile"
                      key={participant.sessionId}
                    >
                      <ParticipantBox
                        participant={participant}
                        call={call}
                        sinkId={localParticipant?.audioOutputDeviceId}
                        toggleMenuPosition="top"
                      />
                    </div>
                  ))}
              </div>
            </div>
            {scrollPosition && scrollPosition !== 'end' && (
              <IconButton
                onClick={scrollEndClickHandler}
                icon="caret-right"
                className="str-video__speaker-layout--participants-bar-button-right"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

const loggedIn: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isLoggedInUser) return 1;
  if (b.isLoggedInUser) return -1;
  return 0;
};
