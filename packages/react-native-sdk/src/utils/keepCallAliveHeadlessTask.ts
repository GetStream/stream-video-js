import { AppRegistry, Platform } from 'react-native';
import type { Call } from '@stream-io/video-client';
import { videoLoggerSystem } from '@stream-io/video-client';
import { StreamVideoRN } from './StreamVideoRN';

export const KEEP_CALL_ALIVE_HEADLESS_TASK_NAME = 'StreamVideoKeepCallAlive';

/**
 * The keep-alive headless task needs access to the active `Call` instance.
 * The keep-alive hook will set this reference before starting the native service.
 *
 * Note: This does NOT survive process death. If you need killed-state support,
 * we'd need a different API (e.g. taskToRun(callCid) + recreate client/call).
 */
export const keepCallAliveCallRef: { current: Call | undefined } = {
  current: undefined,
};

function registerKeepCallAliveHeadlessTaskOnce() {
  if (Platform.OS !== 'android') return;

  // Registering multiple times can throw in RN; guard with a module-level flag.

  if (hasRegistered) return;

  AppRegistry.registerHeadlessTask(
    KEEP_CALL_ALIVE_HEADLESS_TASK_NAME,
    () => async (data: { callCid?: string } | undefined) => {
      const logger = videoLoggerSystem.getLogger(
        'KEEP_CALL_ALIVE_HEADLESS_TASK',
      );
      const callCid = data?.callCid;

      const call = keepCallAliveCallRef.current;
      if (!call) {
        logger.warn(
          'No active call instance available for keep-alive task; skipping.',
          { callCid },
        );
        return;
      }
      if (callCid && call.cid && call.cid !== callCid) {
        logger.warn(
          'Keep-alive task callCid does not match active call; skipping.',
          { callCid, activeCallCid: call.cid },
        );
        return;
      }

      const config = StreamVideoRN.getConfig();
      const taskToRun = config.foregroundService.android.taskToRun;
      try {
        await taskToRun(call);
      } catch (e) {
        logger.error('Keep-alive headless task failed', e);
      }
    },
  );
}

let hasRegistered = false;
registerKeepCallAliveHeadlessTaskOnce();
hasRegistered = true;
