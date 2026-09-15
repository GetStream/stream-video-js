import { AppRegistry, Platform } from 'react-native';
import type { Call } from '@stream-io/video-client';
import { videoLoggerSystem } from '@stream-io/video-client';
import { StreamVideoRN } from './StreamVideoRN';

export const KEEP_CALL_ALIVE_HEADLESS_TASK_NAME = 'StreamVideoKeepCallAlive';

/**
 * The keep-alive headless task needs access to the active `Call` instance.
 * The keep-alive hook will set this reference before starting the native service.
 */
export const keepCallAliveCallRef: { current: Call | undefined } = {
  current: undefined,
};

let resolveRunningTask: (() => void) | undefined;

/**
 * Ends the currently running keep-alive headless task.
 *
 * The task's promise is app-provided (`foregroundService.android.taskToRun`) and by default never
 * resolves, so stopping the native service alone would leave the task registered in
 * `HeadlessJsTaskContext` forever - which keeps RN's timer choreographer callback posted for the
 * rest of the process lifetime. Resolving it here lets React Native unwind the task properly.
 */
export const endKeepCallAliveHeadlessTask = () => {
  resolveRunningTask?.();
  resolveRunningTask = undefined;
};

function registerKeepCallAliveHeadlessTaskOnce() {
  if (Platform.OS !== 'android') return;

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
      // A previous task (if any) must not keep hanging around.
      endKeepCallAliveHeadlessTask();
      const taskEnded = new Promise<void>((resolve) => {
        resolveRunningTask = resolve;
      });
      const ownResolver = resolveRunningTask;

      // React Native stops the foreground service as soon as the promise returned from here
      // settles. `taskToRun` is app-provided and may resolve early - or immediately - so its
      // completion must not end the keep-alive: that would drop the call's background protection
      // while the call is still ongoing. The task's lifetime is owned by the SDK instead, and ends
      // via endKeepCallAliveHeadlessTask() when the call is left.
      (async () => {
        try {
          await taskToRun(call);
          logger.debug(
            'Keep-alive taskToRun completed, keeping the call alive until the call ends',
          );
        } catch (e) {
          logger.error('Keep-alive headless task failed', e);
        }
      })();

      try {
        await taskEnded;
      } finally {
        // a newer task may already have installed its own resolver - clearing it here would leave
        // that task with no way to be ended.
        if (resolveRunningTask === ownResolver) {
          resolveRunningTask = undefined;
        }
      }
    },
  );
}

registerKeepCallAliveHeadlessTaskOnce();
