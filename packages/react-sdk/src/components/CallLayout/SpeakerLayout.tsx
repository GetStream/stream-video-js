import { useEffect, useState } from 'react';

import {
  CallTypes,
  defaultSortPreset,
  SfuModels,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCall, useParticipants } from '@stream-io/video-react-bindings';

import { ParticipantBox } from '../StreamCall';
import { IconButton } from '../Button';
import { useHorizontalScrollPosition } from '../StreamCall/hooks';

export const SpeakerLayout = () => {
  const call = useCall()!;
  // TODO: fix
  const [participantInSpotlight, ...otherParticipants] = useParticipants();
  const [scrollWrapper, setScrollWrapper] = useState<HTMLDivElement | null>(
    null,
  );

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

  useEffect(() => {
    if (otherParticipants.length === 1) {
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
  }, [call, otherParticipants.length]);

  useEffect(() => {
    return () => {
      // reset the sorting to the default for the call type
      const callConfig = CallTypes.get(call.type);
      call.setSortParticipantsBy(
        callConfig.options.sortParticipantsBy || defaultSortPreset,
      );
    };
  }, [call]);

  return (
    <div className="str-video__speaker-layout--wrapper">
      <div className="str-video__speaker-layout">
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
                {otherParticipants.map((participant) => (
                  <div
                    className="str-video__speaker-layout--participant-tile"
                    key={participant.sessionId}
                  >
                    <ParticipantBox participant={participant} call={call} />
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

        <div className="str-video__speaker-layout--spotlight">
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
      </div>
    </div>
  );
};

const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);
