import {
  Call,
  combineComparators,
  Comparator,
  screenSharing,
  speakerLayoutSortPreset,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useEffect } from 'react';
import { resetSortPreset } from './usePaginatedLayoutSortPreset';

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

const loggedIn: Comparator<StreamVideoParticipant> = (a, b) => {
  if (a.isLocalParticipant) return 1;
  if (b.isLocalParticipant) return -1;
  return 0;
};
