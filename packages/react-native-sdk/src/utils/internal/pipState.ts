import { StateStore, field } from '@stream-io/video-client';

/**
 * Picture-in-Picture state, shared across the SDK.
 *
 * These are module scoped on purpose: PiP is a process-wide concern that
 * native events and several unrelated components all read.
 */
const pipStore = new StateStore<{
  isInPiPMode: boolean;
  disablePiPMode: boolean;
}>({ isInPiPMode: false, disablePiPMode: false });

export const isInPiPMode$ = field(pipStore, 'isInPiPMode');
export const disablePiPMode$ = field(pipStore, 'disablePiPMode');

export const setIsInPiPMode = (isInPiPMode: boolean) =>
  pipStore.partialNext({ isInPiPMode });

export const setDisablePiPMode = (disablePiPMode: boolean) =>
  pipStore.partialNext({ disablePiPMode });
