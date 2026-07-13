import { useEffect, useMemo } from 'react';
import {
  Call,
  CallTypes,
  defaultSortPreset,
  hasAudio,
  hasScreenShare,
  hasVideo,
  isPinned,
  paginatedLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { applyFilter, Filter } from '../../../utilities/filter';

export type FilterableParticipant = Pick<
  StreamVideoParticipant,
  'userId' | 'isSpeaking' | 'isDominantSpeaker' | 'name' | 'roles'
> & {
  isPinned: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  hasScreenShare: boolean;
};

export type ParticipantFilter = Filter<FilterableParticipant>;
export type ParticipantPredicate = (
  participant: StreamVideoParticipant,
) => boolean;

export const useFilteredParticipants = ({
  excludeLocalParticipant = false,
  filterParticipants,
}: {
  excludeLocalParticipant?: boolean;
  filterParticipants?: ParticipantFilter | ParticipantPredicate;
}) => {
  const { useParticipants, useRemoteParticipants } = useCallStateHooks();
  const allParticipants = useParticipants();
  const remoteParticipants = useRemoteParticipants();
  return useMemo(() => {
    const unfilteredParticipants = excludeLocalParticipant
      ? remoteParticipants
      : allParticipants;

    return filterParticipants
      ? applyParticipantsFilter(unfilteredParticipants, filterParticipants)
      : unfilteredParticipants;
  }, [
    allParticipants,
    remoteParticipants,
    excludeLocalParticipant,
    filterParticipants,
  ]);
};

export const applyParticipantsFilter = (
  participants: StreamVideoParticipant[],
  filter: ParticipantPredicate | ParticipantFilter,
) => {
  const filterCallback =
    typeof filter === 'function'
      ? filter
      : (participant: StreamVideoParticipant) =>
          applyFilter(
            {
              userId: participant.userId,
              isSpeaking: participant.isSpeaking,
              isDominantSpeaker: participant.isDominantSpeaker,
              name: participant.name,
              roles: participant.roles,
              isPinned: isPinned(participant),
              hasVideo: hasVideo(participant),
              hasAudio: hasAudio(participant),
              hasScreenShare: hasScreenShare(participant),
            },
            filter,
          );

  return participants.filter(filterCallback);
};

export const usePaginatedLayoutSortPreset = (call: Call | undefined) => {
  useEffect(() => {
    if (!call) return;
    call.setSortParticipantsBy(paginatedLayoutSortPreset);
    return () => {
      resetSortPreset(call);
    };
  }, [call]);
};

export const useRawRemoteParticipants = () => {
  const { useRawParticipants } = useCallStateHooks();
  const rawParticipants = useRawParticipants();
  return useMemo(
    () => rawParticipants.filter((p) => !p.isLocalParticipant),
    [rawParticipants],
  );
};

const resetSortPreset = (call: Call) => {
  // reset the sorting to the default for the call type
  const callConfig = CallTypes.get(call.type);
  call.setSortParticipantsBy(
    callConfig.options.sortParticipantsBy || defaultSortPreset,
  );
};
