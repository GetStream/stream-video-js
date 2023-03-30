import { useState, useEffect } from 'react';

import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
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
