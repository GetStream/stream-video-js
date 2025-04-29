import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { hasScreenShare } from '@stream-io/video-client';
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
import {
  ParticipantFilter,
  ParticipantPredicate,
  useFilteredParticipants,
  useSpeakerLayoutSortPreset,
} from './hooks';
import { useCalculateHardLimit } from '../../hooks/useCalculateHardLimit';
import { ParticipantsAudio } from '../Audio';

export type SpeakerLayoutProps = {
  /**
   * The UI to be used for the participant in the spotlight.
   */
  ParticipantViewUISpotlight?: ParticipantViewProps['ParticipantViewUI'];

  /**
   * The UI to be used for the participants in the participants bar.
   */
  ParticipantViewUIBar?: ParticipantViewProps['ParticipantViewUI'];

  /**
   * The position of the participants who are not in focus.
   * Providing `null` will hide the bar.
   */
  participantsBarPosition?: 'top' | 'bottom' | 'left' | 'right' | null;

  /**
   * Hard limits the number of the participants rendered in the participants bar.
   * Providing string `dynamic` will calculate hard limit based on screen width/height.
   */
  participantsBarLimit?: 'dynamic' | number;

  /**
   * When set to `true` will exclude the local participant from layout.
   * @default false
   */
  excludeLocalParticipant?: boolean;

  /**
   * Predicate to filter call participants or a filter object.
   * @example
   * // With a predicate:
   * <SpeakerLayout
   *   filterParticipants={p => p.roles.includes('student')}
   * />
   * @example
   * // With a filter object:
   * <SpeakerLayout
   *   filterParticipants={{
   *     $or: [
   *       { roles: { $contains: 'student' } },
   *       { isPinned: true },
   *     ],
   *   }}
   * />
   */
  filterParticipants?: ParticipantPredicate | ParticipantFilter;

  /**
   * When set to `false` disables mirroring of the local participant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;

  /**
   * Turns on/off the pagination arrows.
   * @default true
   */
  pageArrowsVisible?: boolean;

  /**
   * Whether the layout is muted. Defaults to `false`.
   */
  muted?: boolean;
} & Pick<
  ParticipantViewProps,
  'VideoPlaceholder' | 'PictureInPicturePlaceholder'
>;

const DefaultParticipantViewUIBar = () => (
  <DefaultParticipantViewUI menuPlacement="top-end" />
);

export const SpeakerLayout = ({
  ParticipantViewUIBar = DefaultParticipantViewUIBar,
  ParticipantViewUISpotlight = DefaultParticipantViewUI,
  VideoPlaceholder,
  PictureInPicturePlaceholder,
  participantsBarPosition = 'bottom',
  participantsBarLimit,
  mirrorLocalParticipantVideo = true,
  excludeLocalParticipant = false,
  filterParticipants,
  pageArrowsVisible = true,
  muted,
}: SpeakerLayoutProps) => {
  const call = useCall();
  const { useParticipants, useRemoteParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();
  const remoteParticipants = useRemoteParticipants();
  const [participantInSpotlight, ...otherParticipants] =
    useFilteredParticipants({ excludeLocalParticipant, filterParticipants });
  const [participantsBarWrapperElement, setParticipantsBarWrapperElement] =
    useState<HTMLDivElement | null>(null);
  const [participantsBarElement, setParticipantsBarElement] =
    useState<HTMLDivElement | null>(null);
  const [buttonsWrapperElement, setButtonsWrapperElement] =
    useState<HTMLDivElement | null>(null);

  const isSpeakerScreenSharing =
    participantInSpotlight && hasScreenShare(participantInSpotlight);
  const hardLimit = useCalculateHardLimit(
    buttonsWrapperElement,
    participantsBarElement,
    participantsBarLimit,
  );

  const isVertical =
    participantsBarPosition === 'left' || participantsBarPosition === 'right';
  const isHorizontal =
    participantsBarPosition === 'top' || participantsBarPosition === 'bottom';

  useEffect(() => {
    if (!participantsBarWrapperElement || !call) return;

    const cleanup = call.setViewport(participantsBarWrapperElement);

    return () => cleanup();
  }, [participantsBarWrapperElement, call]);

  const isOneOnOneCall = allParticipants.length === 2;
  useSpeakerLayoutSortPreset(call, isOneOnOneCall);

  let participantsWithAppliedLimit = otherParticipants;

  const hardLimitToApply = isVertical
    ? hardLimit.vertical
    : hardLimit.horizontal;

  if (
    typeof participantsBarLimit !== 'undefined' &&
    hardLimitToApply !== null
  ) {
    participantsWithAppliedLimit = otherParticipants.slice(
      0,
      // subtract 1 if speaker is sharing screen as
      // that one is rendered independently from otherParticipants array
      hardLimitToApply - (isSpeakerScreenSharing ? 1 : 0),
    );
  }

  const mirror = mirrorLocalParticipantVideo ? undefined : false;

  if (!call) return null;

  const renderParticipantsBar =
    participantsBarPosition &&
    (participantsWithAppliedLimit.length > 0 || isSpeakerScreenSharing);
  return (
    <div className="str-video__speaker-layout__wrapper">
      {!muted && <ParticipantsAudio participants={remoteParticipants} />}
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
              muteAudio={true}
              mirror={mirror}
              trackType={
                isSpeakerScreenSharing ? 'screenShareTrack' : 'videoTrack'
              }
              ParticipantViewUI={ParticipantViewUISpotlight}
              VideoPlaceholder={VideoPlaceholder}
              PictureInPicturePlaceholder={PictureInPicturePlaceholder}
            />
          )}
        </div>
        {renderParticipantsBar && (
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
                      PictureInPicturePlaceholder={PictureInPicturePlaceholder}
                      mirror={mirror}
                      muteAudio={true}
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
                      PictureInPicturePlaceholder={PictureInPicturePlaceholder}
                      mirror={mirror}
                      muteAudio={true}
                    />
                  </div>
                ))}
              </div>
            </div>
            {pageArrowsVisible && isVertical && (
              <VerticalScrollButtons
                scrollWrapper={participantsBarWrapperElement}
              />
            )}
            {pageArrowsVisible && isHorizontal && (
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

SpeakerLayout.displayName = 'SpeakerLayout';

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
