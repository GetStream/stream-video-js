import { fromEventPattern, map } from 'rxjs';
import { isReactNative } from '../helpers/platforms';
import { disposeOfMediaStream } from './utils';
import { withoutConcurrency } from '../helpers/concurrency';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';

interface BrowserPermissionConfig {
  constraints: DisplayMediaStreamOptions;
  queryName: PermissionName;
  tracer: Tracer | undefined;
}

export type BrowserPermissionState = PermissionState | 'prompting';

type NativePermissionName = 'microphone' | 'camera';

export class BrowserPermission {
  private ready: Promise<void>;
  private disposeController = new AbortController();
  private state: BrowserPermissionState | undefined;
  private wasPrompted: boolean = false;
  private listeners = new Set<(state: BrowserPermissionState) => void>();
  /**
   * React Native only: the real OS permission status. The behavioral `state`
   * is always `granted` on React Native, so this one is diagnostics-only.
   */
  private nativeState: PermissionState | undefined;
  private nativeListeners = new Set<(state: PermissionState) => void>();
  private logger = videoLoggerSystem.getLogger('permissions');

  constructor(private readonly permission: BrowserPermissionConfig) {
    const signal = this.disposeController.signal;

    if (isReactNative()) {
      const unsubscribe =
        globalThis.streamRNVideoSDK?.nativeEvents?.appForeground?.subscribe(
          () => void this.refreshNativeState(),
        );
      if (unsubscribe) signal.addEventListener('abort', unsubscribe);
      void this.refreshNativeState();
    }

    this.ready = (async () => {
      const assumeGranted = () => {
        if (isReactNative()) {
          this.setState('granted');
        } else {
          this.setState('prompt');
        }
      };

      if (!canQueryPermissions()) {
        return assumeGranted();
      }

      try {
        const status = await navigator.permissions.query({
          name: permission.queryName,
        });

        if (!signal.aborted) {
          this.setState(status.state);
          status.addEventListener('change', () => this.setState(status.state), {
            signal,
          });
        }
      } catch (err) {
        this.logger.debug('Failed to query permission status', err);
        assumeGranted();
      }
    })();
  }

  dispose() {
    this.state = undefined;
    this.nativeState = undefined;
    this.disposeController.abort();
  }

  async getState() {
    await this.ready;
    if (!this.state) {
      throw new Error('BrowserPermission instance possibly disposed');
    }
    return this.state;
  }

  async prompt({
    forcePrompt = false,
    throwOnNotAllowed = false,
  }: { forcePrompt?: boolean; throwOnNotAllowed?: boolean } = {}) {
    return await withoutConcurrency(
      `permission-prompt-${this.permission.queryName}`,
      async () => {
        if (
          (await this.getState()) !== 'prompt' ||
          (this.wasPrompted && !forcePrompt)
        ) {
          const isGranted = this.state === 'granted';

          if (!isGranted && throwOnNotAllowed) {
            throw new Error(
              'Permission was not granted previously, and prompting again is not allowed',
            );
          }

          return isGranted;
        }

        try {
          this.wasPrompted = true;
          this.setState('prompting');
          const stream = await navigator.mediaDevices.getUserMedia(
            this.permission.constraints,
          );
          disposeOfMediaStream(stream);
          this.setState('granted');
          return true;
        } catch (e) {
          if (
            e &&
            typeof e === 'object' &&
            'name' in e &&
            (e.name === 'NotAllowedError' || e.name === 'SecurityError')
          ) {
            this.logger.info('Browser permission was not granted', {
              permission: this.permission,
            });
            this.setState('denied');

            if (throwOnNotAllowed) {
              throw e;
            }

            return false;
          }

          this.logger.error(`Failed to getUserMedia`, {
            error: e,
            permission: this.permission,
          });
          this.setState('prompt');
          throw e;
        }
      },
    );
  }

  /**
   * React Native only: re-queries the real OS permission status and notifies
   * the native listeners on change. Resolves with the latest known status, or
   * `undefined` when it can't be queried (e.g., on web).
   */
  refreshNativeState = async (): Promise<PermissionState | undefined> => {
    const query = globalThis.streamRNVideoSDK?.permissions?.query;
    if (!isReactNative() || !query) return this.nativeState;
    try {
      const { queryName } = this.permission;
      const state = await query(queryName as NativePermissionName);
      if (this.disposeController.signal.aborted) return undefined;
      if (this.nativeState !== state) {
        this.nativeState = state;
        this.nativeListeners.forEach((listener) => listener(state));
      }
    } catch (err) {
      this.logger.debug('Failed to query native permission status', err);
    }
    return this.nativeState;
  };

  /**
   * React Native only: listens for real OS permission status changes.
   * Invokes the callback immediately with the latest known status, if any.
   */
  listenNative = (cb: (state: PermissionState) => void) => {
    this.nativeListeners.add(cb);
    if (this.nativeState) cb(this.nativeState);
    return () => {
      this.nativeListeners.delete(cb);
    };
  };

  listen(cb: (state: BrowserPermissionState) => void) {
    this.listeners.add(cb);
    if (this.state) cb(this.state);
    return () => this.listeners.delete(cb);
  }

  asObservable() {
    return this.getStateObservable().pipe(
      // In some browsers, the 'change' event doesn't reliably emit and hence,
      // permissionState stays in 'prompt' state forever.
      // Typically, this happens when a user grants one-time permission.
      // Instead of checking if a permission is granted, we check if it isn't denied
      map((state) => state !== 'denied'),
    );
  }

  asStateObservable() {
    return this.getStateObservable();
  }

  getIsPromptingObservable() {
    return this.getStateObservable().pipe(
      map((state) => state === 'prompting'),
    );
  }

  private getStateObservable() {
    return fromEventPattern<BrowserPermissionState>(
      (handler) => this.listen(handler),
      (handler, unlisten) => unlisten(),
    );
  }

  private setState(state: BrowserPermissionState) {
    if (this.state !== state) {
      // on React Native, the state is hardcoded to 'granted', so the real
      // native state is traced per call instead (see `listenNative`)
      if (!isReactNative()) {
        const { tracer, queryName } = this.permission;
        const traceKey = `navigator.mediaDevices.${queryName}.permission`;
        tracer?.trace(traceKey, { previous: this.state, state });
      }
      this.state = state;
      this.listeners.forEach((listener) => listener(state));
    }
  }
}

function canQueryPermissions() {
  return (
    !isReactNative() &&
    typeof navigator !== 'undefined' &&
    !!navigator.permissions?.query
  );
}
