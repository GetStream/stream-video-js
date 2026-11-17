import { adb } from './AndroidSystemDialogs';

const callService =
  'io.getstream.rnvideosample/io.getstream.rn.callingx.CallService';

/**
 * Whether callingx's `CallService` (the foreground service that shows the call notification) is
 * running, asked from Android's activity manager. It prints `(nothing)` when the service isn't.
 */
export const isCallServiceRunning = () =>
  adb('shell', 'dumpsys', 'activity', 'services', callService).includes(
    'ServiceRecord{',
  );
