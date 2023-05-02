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

import { ParticipantView, DefaultParticipantViewUI } from '../ParticipantView';
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

  if (!call) return null;

  const isSpeakerScreenSharing = hasScreenShare(participantInSpotlight);
  return (
    <div className="str-video__speaker-layout__wrapper">
      <div className="str-video__speaker-layout">
        <div className="str-video__speaker-layout__spotlight">
          {participantInSpotlight && (
            <ParticipantView
              participant={participantInSpotlight}
              muteAudio={isSpeakerScreenSharing}
              videoKind={isSpeakerScreenSharing ? 'screen' : 'video'}
              sinkId={localParticipant?.audioOutputDeviceId}
            >
              <DefaultParticipantViewUI participant={participantInSpotlight} />
            </ParticipantView>
          )}
        </div>
        {otherParticipants.length > 0 && (
          <div className="str-video__speaker-layout__participants-bar-buttons-wrapper">
            {scrollPosition && scrollPosition !== 'start' && (
              <IconButton
                onClick={scrollStartClickHandler}
                icon="caret-left"
                className="str-video__speaker-layout__participants-bar--button-left"
              />
            )}
            <div
              className="str-video__speaker-layout__participants-bar-wrapper"
              ref={setScrollWrapper}
            >
              <div className="str-video__speaker-layout__participants-bar">
                {isSpeakerScreenSharing && (
                  <div
                    className="str-video__speaker-layout__participant-tile"
                    key={participantInSpotlight.sessionId}
                  >
                    <ParticipantView
                      participant={participantInSpotlight}
                      sinkId={localParticipant?.audioOutputDeviceId}
                    >
                      <DefaultParticipantViewUI
                        participant={participantInSpotlight}
                        menuPlacement="top-end"
                      />
                    </ParticipantView>
                  </div>
                )}
                {otherParticipants.map((participant) => (
                  <div
                    className="str-video__speaker-layout__participant-tile"
                    key={participant.sessionId}
                  >
                    <ParticipantView
                      participant={participant}
                      sinkId={localParticipant?.audioOutputDeviceId}
                    >
                      <DefaultParticipantViewUI
                        participant={participant}
                        menuPlacement="top-end"
                      />
                    </ParticipantView>
                  </div>
                ))}
              </div>
            </div>
            {scrollPosition && scrollPosition !== 'end' && (
              <IconButton
                onClick={scrollEndClickHandler}
                icon="caret-right"
                className="str-video__speaker-layout__participants-bar--button-right"
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
