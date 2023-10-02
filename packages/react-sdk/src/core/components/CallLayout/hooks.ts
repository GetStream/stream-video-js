import { useEffect } from 'react';
import {
  Call,
  CallTypes,
  combineComparators,
  Comparator,
  defaultSortPreset,
  paginatedLayoutSortPreset,
  screenSharing,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';

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
