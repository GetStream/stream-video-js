import {
  Call,
  CallTypes,
  defaultSortPreset,
  paginatedLayoutSortPreset,
} from '@stream-io/video-client';
import { useEffect } from 'react';

const resetSortPreset = (call: Call) => {
  // reset the sorting to the default for the call type
  const callConfig = CallTypes.get(call.type);
  call.setSortParticipantsBy(
    callConfig.options.sortParticipantsBy || defaultSortPreset,
  );
};

export const usePaginatedLayoutSortPreset = (call: Call | undefined) => {
  useEffect(() => {
    if (!call) {
      return;
    }
    call.setSortParticipantsBy(paginatedLayoutSortPreset);
    return () => {
      resetSortPreset(call);
    };
  }, [call]);
};
