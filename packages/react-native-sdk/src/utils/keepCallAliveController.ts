import {
  AppRegistry,
  AppState,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { videoLoggerSystem } from '@stream-io/video-client';
import NativeStreamVideoReactNative from '../native/NativeStreamVideoReactNative';
import { getCallingxLibIfAvailable } from './push/libs';
import { StreamVideoRN } from './StreamVideoRN';

/**
 * The foreground service that carries a keep-alive:
 * - `sdk` — the SDK's own `StreamCallKeepAliveHeadlessService`, for calls callingx does not manage.
 * - `callingx` — callingx's Telecom `CallService`, which already runs for the calls it manages.
 */
export type KeepAliveBackend = 'sdk' | 'callingx';
type KeepAliveTaskData = { backend?: string } | undefined;

const KEEP_CALL_ALIVE_TASK_NAME = 'StreamVideoKeepCallAlive';

const isKeepAliveBackend = (value: unknown): value is KeepAliveBackend =>
  value === 'sdk' || value === 'callingx';

type BackendState = {
  owners: Set<string>;
  resolveTask: (() => void) | undefined;
  /** Pending debounced stop (callingx only). */
  stopTimer: ReturnType<typeof setTimeout> | undefined;
  /** In-flight or accepted native start (sdk only), cleared when the service is stopped. */
  started: Promise<boolean> | undefined;
};

const createBackendState = (): BackendState => ({
  owners: new Set(),
  resolveTask: undefined,
  stopTimer: undefined,
  started: undefined,
});

/**
 * Ref-counted ownership of the Android call keep-alive.
 *
 * A HeadlessJS task keeps React Native's JS timers running while the app is backgrounded; the
 * foreground service behind it keeps the process alive. Several independent owners (the ringing
 * push flow, the keep-call-alive hook) can hold a backend's task at once; it is ended only when its
 * last owner releases.
 */
class KeepAliveController {
  // Grace period for the debounced callingx stop: a re-acquire within this window (the ringing-push
  // -> keep-alive hand-off of the same call, whose owners are taken and released from independent
  // places in no guaranteed order) cancels the stop and reuses the running task, avoiding a
  // stop/restart race on the single native task slot. The SDK backend has a single owner source and
  // every start/stop originates in JS, so it has nothing to bridge and stops immediately.
  private static readonly CALLINGX_STOP_DEBOUNCE_MS = 2000;

  private backends: Record<KeepAliveBackend, BackendState> = {
    sdk: createBackendState(),
    callingx: createBackendState(),
  };

  private logger = videoLoggerSystem.getLogger('KeepAliveController');

  /**
   * Registers the keep-alive HeadlessJS task. Call once, at module load: a task started before it is
   * registered is finished right away by React Native.
   */
  registerHeadlessTask = () => {
    if (Platform.OS !== 'android') {
      return;
    }
    AppRegistry.registerHeadlessTask(
      KEEP_CALL_ALIVE_TASK_NAME,
      () => this.holdTask,
    );
  };

  /**
   * Takes ownership of [backend]'s keep-alive, starting its service and task if needed.
   *
   * @param owner a stable, unique key for the holder (e.g. `push:<cid>`, `keepalive:<cid>`).
   * @param callCid the call being kept alive; required by the `sdk` backend.
   * @returns whether the keep-alive is running for this owner. On false the owner is not held and
   *   the caller may retry later. Never throws.
   */
  acquire = async (
    owner: string,
    backend: KeepAliveBackend,
    callCid?: string,
  ): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    const state = this.backends[backend];
    if (state.stopTimer) {
      clearTimeout(state.stopTimer);
      state.stopTimer = undefined;
    }
    state.owners.add(owner);

    const started = await this.start(backend, callCid);
    if (!started && state.owners.delete(owner) && state.owners.size === 0) {
      this.finishTask(state);
    }
    return started;
  };

  /**
   * Gives up [owner]'s hold on [backend]'s keep-alive. The task is ended once the last owner has
   * released: immediately for `sdk`, after a short debounce for `callingx`. Never throws.
   */
  release = (owner: string, backend: KeepAliveBackend): void => {
    if (Platform.OS !== 'android') return;

    const state = this.backends[backend];
    if (!state.owners.delete(owner) || state.owners.size > 0) {
      return;
    }

    if (backend === 'sdk') {
      this.stopSdkService();
      return;
    }

    if (state.stopTimer) return;

    state.stopTimer = setTimeout(() => {
      state.stopTimer = undefined;
      if (state.owners.size > 0) {
        return;
      }
      this.finishTask(state);
    }, KeepAliveController.CALLINGX_STOP_DEBOUNCE_MS);
  };

  /**
   * The HeadlessJS task body: holds until the starting backend's last owner releases.
   * Resolves immediately when nothing holds the backend — e.g. callingx booting React Native from a
   * push before any JS owner exists, or a start whose owner was already released.
   */
  private holdTask = async (data: KeepAliveTaskData): Promise<void> => {
    const backend = data?.backend;
    if (!isKeepAliveBackend(backend)) {
      this.logger.warn(
        `Keep-alive task started with unknown backend: ${backend}`,
      );
      return;
    }
    const state = this.backends[backend];
    if (state.owners.size === 0 && !state.stopTimer) return;

    this.finishTask(state);
    await new Promise<void>((resolve) => {
      state.resolveTask = resolve;
    });
  };

  private start = (
    backend: KeepAliveBackend,
    callCid: string | undefined,
  ): Promise<boolean> => {
    if (backend === 'callingx') {
      const callingx = getCallingxLibIfAvailable();
      if (!callingx) {
        this.logger.warn(
          'callingx is not available, can not keep the call alive',
        );
        return Promise.resolve(false);
      }

      try {
        callingx.startBackgroundTask();
        return Promise.resolve(true);
      } catch (e) {
        this.logger.warn('Failed to start the callingx keep-alive task', e);
        return Promise.resolve(false);
      }
    }

    const state = this.backends.sdk;
    if (state.started) {
      return state.started;
    }
    if (!callCid) {
      this.logger.warn(
        'No call cid, can not start the keep-call-alive service',
      );
      return Promise.resolve(false);
    }
    const started: Promise<boolean> = startForegroundService(callCid).then(
      (ok) => {
        // only keep an accepted start, so that a later acquire can retry
        if (!ok && state.started === started) {
          state.started = undefined;
        }
        return ok;
      },
    );
    state.started = started;
    return started;
  };

  private finishTask = (state: BackendState) => {
    const resolve = state.resolveTask;
    state.resolveTask = undefined;
    resolve?.();
  };

  private stopSdkService = () => {
    const state = this.backends.sdk;
    state.started = undefined;
    // let the headless task resolve so RN unwinds it, then stop the foreground service
    this.finishTask(state);
    NativeStreamVideoReactNative.stopKeepCallAliveService().catch((e) => {
      this.logger.warn('Failed to stop keep-call-alive foreground service', e);
    });
  };
}

/**
 * @returns true when the native foreground service was asked to start.
 */
async function startForegroundService(call_cid: string): Promise<boolean> {
  const logger = videoLoggerSystem.getLogger('startForegroundService');
  const isCallAliveConfigured = (() => {
    try {
      return NativeStreamVideoReactNative.isCallAliveConfigured();
    } catch (e) {
      logger.warn('Failed to check whether KeepCallAlive is configured', e);
      return false;
    }
  })();
  if (!isCallAliveConfigured) {
    logger.warn(
      'KeepCallAlive is not configured, the call will not survive the app going to the ' +
        'background: audio publishing stops and the user is eventually dropped from the call. ' +
        'Declare android.permission.FOREGROUND_SERVICE and ' +
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK in the app manifest (see logcat, ' +
        'tag StreamVideoReactNative, for the exact list of missing permissions).',
    );
    return false;
  }
  // Check for notification permission (Android 13+) before starting the service.
  const hasPostNotificationsPermission =
    Number(Platform.Version) < 33 ||
    (await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    ));
  if (!hasPostNotificationsPermission) {
    logger.info(
      'Notification permission not granted, can not start foreground service to keep the call alive',
    );
    return false;
  }
  const videoConfig = StreamVideoRN.getConfig();
  const foregroundServiceConfig = videoConfig.foregroundService;
  const notificationTexts = foregroundServiceConfig.android.notificationTexts;
  const channel = foregroundServiceConfig.android.channel;
  const smallIconName = videoConfig.push?.android?.smallIcon;

  // NOTE: we use requestAnimationFrame to ensure that the foreground service is started after all the current UI operations are done
  // this is a workaround for the crash - android.app.RemoteServiceException$ForegroundServiceDidNotStartInTimeException: Context.startForegroundService() did not then call Service.startForeground()
  // this crash was reproducible only in some android devices
  return new Promise<boolean>((resolve) => {
    requestAnimationFrame(async () => {
      // The service declares the camera/microphone foreground service types, which are
      // while-in-use permissions: Android requires startForegroundService() to be called while the
      // app has a visible activity, otherwise the start is rejected. The frame we deferred to can
      // land after the app left the foreground, so re-check before calling native.
      if (AppState.currentState !== 'active') {
        logger.info(
          'App is no longer in the foreground, not starting the keep-call-alive foreground service',
        );
        resolve(false);
        return;
      }
      try {
        await NativeStreamVideoReactNative.startKeepCallAliveService(
          call_cid,
          channel.id,
          channel.name,
          notificationTexts.title,
          notificationTexts.body,
          smallIconName ?? null,
        );
        resolve(true);
      } catch (e) {
        logger.warn('Failed to start keep-call-alive foreground service', e);
        resolve(false);
      }
    });
  });
}

export const getKeepAliveBackend = (
  isRingingCall: boolean,
): KeepAliveBackend => {
  const callingx = getCallingxLibIfAvailable();
  const isCallingxManaged =
    !!callingx?.isSetup && (isRingingCall || callingx.isOngoingCallsEnabled);
  return isCallingxManaged ? 'callingx' : 'sdk';
};

export const keepAliveController = new KeepAliveController();
