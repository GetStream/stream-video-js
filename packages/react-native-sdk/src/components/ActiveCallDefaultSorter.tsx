import { useEffect } from 'react';
import {
  useActiveCall,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import {
  Comparator,
  StreamVideoParticipant,
  VisibilityState,
  combineComparators,
  conditional,
  dominantSpeaker,
  pinned,
  publishingAudio,
  publishingVideo,
  screenSharing,
  speaking,
} from '@stream-io/video-client';

export const ActiveCallDefaultSorter = () => {
  const remoteParticipants = useRemoteParticipants();
  const isOneToOneCall = remoteParticipants.length === 1;
  const activeCall = useActiveCall();
  useEffect(() => {
    if (!activeCall) return;
    const sortingPreset = getDefaultSortingPreset(isOneToOneCall);
    activeCall.setSortParticipantsBy(sortingPreset);
  }, [activeCall, isOneToOneCall]);
  return null;
};

/**
 * Creates the default sorting preset for the participants list.
 *
 * This function supports two modes:
 *
 * 1) 1:1 calls, where we want to always show the other participant in the spotlight,
 *  and not show them in the participants list.
 *
 * 2) group calls, where we want to show the participants in the participants bar
 *  in a custom order:
 *  - screen sharing participants
 *  - dominant speaker
 *  - pinned participants
 *  - participants who are speaking
 *  - participants who are publishing video
 *  - participants who are publishing audio
 *  - other participants
 *
 * @param isOneToOneCall whether the call is a 1:1 call.
 */
const getDefaultSortingPreset = (
  isOneToOneCall: boolean = false,
): Comparator<StreamVideoParticipant> => {
  // 1:1 calls are a special case, where we want to always show the other
  // participant in the spotlight, and not show them in the participants bar.
  if (isOneToOneCall) {
    return (a: StreamVideoParticipant, b: StreamVideoParticipant) => {
      if (a.isLoggedInUser) return 1;
      if (b.isLoggedInUser) return -1;
      return 0;
    };
  }

  // a comparator decorator which applies the decorated comparator only if the
  // participant is invisible.
  // This ensures stable sorting when all participants are visible.
  const ifInvisibleBy = conditional(
    (a: StreamVideoParticipant, b: StreamVideoParticipant) =>
      a.viewportVisibilityState === VisibilityState.INVISIBLE ||
      b.viewportVisibilityState === VisibilityState.INVISIBLE,
  );

  // the custom sorting preset
  return combineComparators(
    screenSharing,
    dominantSpeaker,
    pinned,
    ifInvisibleBy(speaking),
    ifInvisibleBy(publishingVideo),
    ifInvisibleBy(publishingAudio),
  );
};
