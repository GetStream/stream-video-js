import { useState, useEffect } from 'react';
import { Call, SfuModels } from '@stream-io/video-client';

import {
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-bindings';
import { ParticipantBox } from '../../core/components/ParticipantBox/ParticipantBox';
import { Video } from '../Video';

import { useVerticalScrollPosition } from './hooks';
import { IconButton } from '../Button';

export const CallParticipantsScreenView = (props: { call: Call }) => {
  const { call } = props;
  const localParticipant = useLocalParticipant();
  const allParticipants = useParticipants();
  const firstScreenSharingParticipant = allParticipants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const [scrollWrapper, setScrollWrapper] = useState<HTMLDivElement | null>(
    null,
  );

  useEffect(() => {
    if (!scrollWrapper) return;

    const cleanup = call.viewportTracker.setViewport(scrollWrapper);

    return () => cleanup();
  }, [scrollWrapper, call.viewportTracker]);

  const scrollUpClickHandler = () => {
    scrollWrapper?.scrollBy({ top: -150, behavior: 'smooth' });
  };

  const scrollDownClickHandler = () => {
    scrollWrapper?.scrollBy({ top: 150, behavior: 'smooth' });
  };

  const scrollPosition = useVerticalScrollPosition(scrollWrapper);

  const [overlayVisible, setOverlayVisible] = useState(
    () =>
      firstScreenSharingParticipant?.sessionId === localParticipant?.sessionId,
  );

  return (
    <div className="str-video__call-participants-screen-view">
      <div className="str-video__call-participants-screen-view__screen">
        {firstScreenSharingParticipant && (
          <>
            <span className="str-video__call-participants-screen-view__screen__presenter">
              {firstScreenSharingParticipant.name ||
                firstScreenSharingParticipant.userId}{' '}
              is presenting their screen.
            </span>
            <div className="str-video__call-participants-screen-view__wrapper">
              <Video
                className="str-video__screen-share"
                participant={firstScreenSharingParticipant}
                call={call}
                kind="screen"
                autoPlay
                muted
              />
              {overlayVisible && (
                <div className="str-video__call-participants-screen-view__overlay">
                  <div>
                    <div>
                      To avoid an infinity mirror, don't share your entire
                      screen or browser window.
                    </div>
                    <div>
                      Share just a single tab or a different window instead.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOverlayVisible(false);
                    }}
                  >
                    Got it
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="str-video__call-participants-screen-view__buttons-wrapper">
        {scrollPosition && scrollPosition !== 'top' && (
          <IconButton
            onClick={scrollUpClickHandler}
            icon="caret-up"
            className="str-video__call-participants-screen-view__button-up"
          />
        )}
        <div
          ref={setScrollWrapper}
          className="str-video__call-participants-screen-view__participants-wrapper"
        >
          <div className="str-video__call-participants-screen-view__participants">
            {allParticipants.map((participant) => (
              <ParticipantBox
                key={participant.sessionId}
                participant={participant}
                call={call}
                sinkId={localParticipant?.audioOutputDeviceId}
              />
            ))}
          </div>
        </div>
        {scrollPosition && scrollPosition !== 'bottom' && (
          <IconButton
            onClick={scrollDownClickHandler}
            icon="caret-down"
            className="str-video__call-participants-screen-view__button-down"
          />
        )}
      </div>
    </div>
  );
};
