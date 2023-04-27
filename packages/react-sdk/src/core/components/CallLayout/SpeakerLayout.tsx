import { useEffect, useState } from 'react';

import {
  CallTypes,
  defaultSortPreset,
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
import { IconButton } from '../../../components/Button';
import { useHorizontalScrollPosition } from '../../../components/StreamCall/hooks';

export const SpeakerLayout = () => {
  const call = useCall()!;
  const [participantInSpotlight, ...otherParticipants] = useParticipants();
  const [scrollWrapper, setScrollWrapper] = useState<HTMLDivElement | null>(
    null,
  );
  const localParticipant = useLocalParticipant();

  const scrollPosition = useHorizontalScrollPosition(scrollWrapper);

  const scrollStartClickHandler = () => {
    scrollWrapper?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollEndClickHandler = () => {
    scrollWrapper?.scrollBy({ left: 150, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!scrollWrapper) return;

    const cleanup = call.viewportTracker.setViewport(scrollWrapper);

    return () => cleanup();
  }, [scrollWrapper, call.viewportTracker]);

  const isOneToOneCall = otherParticipants.length === 1;
  useEffect(() => {
    if (isOneToOneCall) {
      // always show the remote participant in the spotlight.
      call.setSortParticipantsBy((a, b) => {
        if (a.isLoggedInUser) return 1;
        if (b.isLoggedInUser) return -1;
        return 0;
      });
    } else {
      // otherwise, use the default sorting preset.
      call.setSortParticipantsBy(speakerLayoutSortPreset);
    }
  }, [call, isOneToOneCall]);

  useEffect(() => {
    return () => {
      // reset the sorting to the default for the call type
      const callConfig = CallTypes.get(call.type);
      call.setSortParticipantsBy(
        callConfig.options.sortParticipantsBy || defaultSortPreset,
      );
    };
  }, [call]);

  const isSpeakerScreenSharing = hasScreenShare(participantInSpotlight);
  return (
    <div className="str-video__speaker-layout--wrapper">
      <div className="str-video__speaker-layout">
        <div className="str-video__speaker-layout--spotlight">
          {participantInSpotlight && (
            <ParticipantBox
              participant={participantInSpotlight}
              call={call}
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
                {isSpeakerScreenSharing && (
                  <div
                    className="str-video__speaker-layout--participant-tile"
                    key={participantInSpotlight.sessionId}
                  >
                    <ParticipantBox
                      participant={participantInSpotlight}
                      call={call}
                      sinkId={localParticipant?.audioOutputDeviceId}
                    />
                  </div>
                )}
                {otherParticipants.map((participant) => (
                  <div
                    className="str-video__speaker-layout--participant-tile"
                    key={participant.sessionId}
                  >
                    <ParticipantBox
                      participant={participant}
                      call={call}
                      sinkId={localParticipant?.audioOutputDeviceId}
                      toggleMenuPosition="top"
                      videoKind={
                        isOneToOneCall && hasScreenShare(participant)
                          ? 'screen'
                          : 'video'
                      }
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
