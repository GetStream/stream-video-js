import { useEffect, useMemo } from 'react';
import {
  Call,
  CallTypes,
  combineComparators,
  Comparator,
  defaultSortPreset,
  hasAudio,
  hasVideo,
  isPinned,
  paginatedLayoutSortPreset,
  screenSharing,
  speakerLayoutSortPreset,
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
};

export type ParticipantFilter = Filter<FilterableParticipant>;
export type ParticipantPredicate = (
  paritcipant: StreamVideoParticipant,
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

export const useSpeakerLayoutSortPreset = (
  call: Call | undefined,
  isOneOnOneCall: boolean,
) => {
  useEffect(() => {
    if (!call) return;
    // always show the remote participant in the spotlight
    if (isOneOnOneCall) {
      call.setSortParticipantsBy(combineComparators(screenSharing, loggedIn));
    } else {
      call.setSortParticipantsBy(speakerLayoutSortPreset);
    }
    return () => {
      resetSortPreset(call);
    };
  }, [call, isOneOnOneCall]);
};

const resetSortPreset = (call: Call) => {
  // reset the sorting to the default for the call type
  const callConfig = CallTypes.get(call.type);
  call.setSortParticipantsBy(
    callConfig.options.sortParticipantsBy || defaultSortPreset,
  );
};

const loggedIn: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isLocalParticipant) return 1;
  if (b.isLocalParticipant) return -1;
  return 0;
};
