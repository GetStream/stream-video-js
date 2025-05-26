import {
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-bindings';
import { useEffect, useState } from 'react';

import { ParticipantsAudio } from '../Audio';
import {
  DefaultParticipantViewUI,
  ParticipantView,
  ParticipantViewProps,
} from '../ParticipantView';
import {
  ParticipantFilter,
  ParticipantPredicate,
  useFilteredParticipants,
  usePaginatedLayoutSortPreset,
} from './hooks';
import { hasScreenShare } from '@stream-io/video-client';
import { Icon } from '../../../components';

export type PipLayoutProps = {
  /**
   * Whether to exclude the local participant from the grid.
   * @default false
   */
  excludeLocalParticipant?: boolean;

  /**
   * Predicate to filter call participants or a filter object.
   * @example
   * // With a predicate:
   * <PipLayout
   *   filterParticipants={p => p.roles.includes('student')}
   * />
   * @example
   * // With a filter object:
   * <PipLayout
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
   * When set to `false` disables mirroring of the local partipant's video.
   * @default true
   */
  mirrorLocalParticipantVideo?: boolean;
} & Pick<ParticipantViewProps, 'ParticipantViewUI' | 'VideoPlaceholder'>;

const Pip = (props: PipLayoutProps) => {
  const { t } = useI18n();
  const {
    excludeLocalParticipant = false,
    filterParticipants,
    mirrorLocalParticipantVideo = true,
    VideoPlaceholder,
    ParticipantViewUI = DefaultParticipantViewUI,
  } = props;
  const [layoutWrapperElement, setLayoutWrapperElement] =
    useState<HTMLDivElement | null>(null);

  const call = useCall();
  const participants = useFilteredParticipants({
    excludeLocalParticipant,
    filterParticipants,
  });
  const screenSharingParticipant = participants.find((p) => hasScreenShare(p));

  usePaginatedLayoutSortPreset(call);

  useEffect(() => {
    if (!layoutWrapperElement || !call) return;
    return call.setViewport(layoutWrapperElement);
  }, [layoutWrapperElement, call]);

  const mirror = mirrorLocalParticipantVideo ? undefined : false;

  if (!call) return null;

  return (
    <div className="str-video__pip-layout" ref={setLayoutWrapperElement}>
      {screenSharingParticipant &&
        (screenSharingParticipant.isLocalParticipant ? (
          <div className="str-video__pip-screen-share-local">
            <Icon icon="screen-share-off" />
            <span className="str-video__pip-screen-share-local__title">
              {t('You are presenting your screen')}
            </span>
          </div>
        ) : (
          <ParticipantView
            participant={screenSharingParticipant}
            trackType="screenShareTrack"
            muteAudio
            mirror={false}
            VideoPlaceholder={VideoPlaceholder}
            ParticipantViewUI={ParticipantViewUI}
          />
        ))}
      {participants.map((participant) => (
        <ParticipantView
          key={participant.sessionId}
          participant={participant}
          muteAudio
          mirror={mirror}
          VideoPlaceholder={VideoPlaceholder}
          ParticipantViewUI={ParticipantViewUI}
        />
      ))}
    </div>
  );
};

Pip.displayName = 'PipLayout.Pip';

const Host = () => {
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();
  return <ParticipantsAudio participants={remoteParticipants} />;
};

Host.displayName = 'PipLayout.Host';

export const PipLayout = { Pip, Host };
