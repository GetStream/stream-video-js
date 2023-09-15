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
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import {
  DefaultParticipantViewUI,
  ParticipantView,
  ParticipantViewProps,
} from '../ParticipantView';
import { IconButton } from '../../../components';
import {
  useHorizontalScrollPosition,
  useVerticalScrollPosition,
} from '../../../hooks';
import clsx from 'clsx';
import { useCalculateHardLimit } from '../../hooks';

export type SpeakerLayoutProps = {
  ParticipantViewUISpotlight?: ParticipantViewProps['ParticipantViewUI'];
  ParticipantViewUIBar?: ParticipantViewProps['ParticipantViewUI'];
  /**
   * The position of the particpants who are not in focus.
   * Providing `null` will hide the bar.
   */
  participantsBarPosition?: 'top' | 'bottom' | 'left' | 'right' | null;
  /**
   * Hard limits the number of the participants rendered in the participants bar.
   * Providing string `dynamic` will calculate hard limit based on screen width/height.
   */
  participantsBarLimit?: 'dynamic' | number;
} & Pick<ParticipantViewProps, 'VideoPlaceholder'>;

const DefaultParticipantViewUIBar = () => (
  <DefaultParticipantViewUI menuPlacement="top-end" />
);

const DefaultParticipantViewUISpotlight = () => <DefaultParticipantViewUI />;

export const SpeakerLayout = ({
  ParticipantViewUIBar = DefaultParticipantViewUIBar,
  ParticipantViewUISpotlight = DefaultParticipantViewUISpotlight,
  VideoPlaceholder,
  participantsBarPosition = 'bottom',
  participantsBarLimit,
}: SpeakerLayoutProps) => {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const [participantInSpotlight, ...otherParticipants] = useParticipants();
  const [participantsBarWrapperElement, setParticipantsBarWrapperElement] =
    useState<HTMLDivElement | null>(null);
  const [participantsBarElement, setParticipantsBarElement] =
    useState<HTMLDivElement | null>(null);
  const [buttonsWrapperElement, setButtonsWrapperElement] =
    useState<HTMLDivElement | null>(null);

  const isSpeakerScreenSharing = hasScreenShare(participantInSpotlight);
  const hardLimit = useCalculateHardLimit(
    buttonsWrapperElement,
    participantsBarElement,
    participantsBarLimit,
  );

  const isVertical =
    participantsBarPosition === 'left' || participantsBarPosition === 'right';
  const isHorizontal =
    participantsBarPosition === 'top' || participantsBarPosition === 'bottom';
  const isOneOnOneCall = otherParticipants.length === 1;

  useEffect(() => {
    if (!participantsBarWrapperElement || !call) return;

    const cleanup = call.setViewport(participantsBarWrapperElement);
    return () => cleanup();
  }, [participantsBarWrapperElement, call]);

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

  let participantsWithAppliedLimit = otherParticipants;

  if (typeof participantsBarLimit !== 'undefined') {
    const hardLimitToApply = isVertical
      ? hardLimit.vertical
      : hardLimit.horizontal;

    participantsWithAppliedLimit = otherParticipants.slice(
      0,
      // subtract 1 if speaker is sharing screen as
      // that one is rendered independently from otherParticipants array
      hardLimitToApply - (isSpeakerScreenSharing ? 1 : 0),
    );
  }

  if (!call) return null;

  return (
    <div className="str-video__speaker-layout__wrapper">
      <div
        className={clsx(
          'str-video__speaker-layout',
          participantsBarPosition &&
            `str-video__speaker-layout--variant-${participantsBarPosition}`,
        )}
      >
        <div className="str-video__speaker-layout__spotlight">
          {participantInSpotlight && (
            <ParticipantView
              participant={participantInSpotlight}
              muteAudio={isSpeakerScreenSharing}
              trackType={
                isSpeakerScreenSharing ? 'screenShareTrack' : 'videoTrack'
              }
              ParticipantViewUI={ParticipantViewUISpotlight}
              VideoPlaceholder={VideoPlaceholder}
            />
          )}
        </div>
        {participantsWithAppliedLimit.length > 0 && participantsBarPosition && (
          <div
            ref={setButtonsWrapperElement}
            className="str-video__speaker-layout__participants-bar-buttons-wrapper"
          >
            <div
              className="str-video__speaker-layout__participants-bar-wrapper"
              ref={setParticipantsBarWrapperElement}
            >
              <div
                ref={setParticipantsBarElement}
                className="str-video__speaker-layout__participants-bar"
              >
                {isSpeakerScreenSharing && (
                  <div
                    className="str-video__speaker-layout__participant-tile"
                    key={participantInSpotlight.sessionId}
                  >
                    <ParticipantView
                      participant={participantInSpotlight}
                      ParticipantViewUI={ParticipantViewUIBar}
                      VideoPlaceholder={VideoPlaceholder}
                    />
                  </div>
                )}
                {participantsWithAppliedLimit.map((participant) => (
                  <div
                    className="str-video__speaker-layout__participant-tile"
                    key={participant.sessionId}
                  >
                    <ParticipantView
                      participant={participant}
                      ParticipantViewUI={ParticipantViewUIBar}
                      VideoPlaceholder={VideoPlaceholder}
                    />
                  </div>
                ))}
              </div>
            </div>
            {isVertical && (
              <VerticalScrollButtons
                scrollWrapper={participantsBarWrapperElement}
              />
            )}
            {isHorizontal && (
              <HorizontalScrollButtons
                scrollWrapper={participantsBarWrapperElement}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

type ScrollButtonsProps<T extends HTMLElement> = {
  scrollWrapper: T | null;
};

const HorizontalScrollButtons = <T extends HTMLElement>({
  scrollWrapper,
}: ScrollButtonsProps<T>) => {
  const scrollPosition = useHorizontalScrollPosition(scrollWrapper);

  const scrollStartClickHandler = () => {
    scrollWrapper?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollEndClickHandler = () => {
    scrollWrapper?.scrollBy({ left: 150, behavior: 'smooth' });
  };
  return (
    <>
      {scrollPosition && scrollPosition !== 'start' && (
        <IconButton
          onClick={scrollStartClickHandler}
          icon="caret-left"
          className="str-video__speaker-layout__participants-bar--button-left"
        />
      )}
      {scrollPosition && scrollPosition !== 'end' && (
        <IconButton
          onClick={scrollEndClickHandler}
          icon="caret-right"
          className="str-video__speaker-layout__participants-bar--button-right"
        />
      )}
    </>
  );
};

const VerticalScrollButtons = <T extends HTMLElement>({
  scrollWrapper,
}: ScrollButtonsProps<T>) => {
  const scrollPosition = useVerticalScrollPosition(scrollWrapper);

  const scrollTopClickHandler = () => {
    scrollWrapper?.scrollBy({ top: -150, behavior: 'smooth' });
  };

  const scrollBottomClickHandler = () => {
    scrollWrapper?.scrollBy({ top: 150, behavior: 'smooth' });
  };
  return (
    <>
      {scrollPosition && scrollPosition !== 'top' && (
        <IconButton
          onClick={scrollTopClickHandler}
          icon="caret-up"
          className="str-video__speaker-layout__participants-bar--button-top"
        />
      )}
      {scrollPosition && scrollPosition !== 'bottom' && (
        <IconButton
          onClick={scrollBottomClickHandler}
          icon="caret-down"
          className="str-video__speaker-layout__participants-bar--button-bottom"
        />
      )}
    </>
  );
};

const hasScreenShare = (p?: StreamVideoParticipant) =>
  !!p?.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE);

const loggedIn: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isLocalParticipant) return 1;
  if (b.isLocalParticipant) return -1;
  return 0;
};
