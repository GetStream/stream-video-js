import { fromEventPattern, map } from 'rxjs';
import { isReactNative } from '../helpers/platforms';
import { disposeOfMediaStream } from './utils';
import { withoutConcurrency } from '../helpers/concurrency';
import { videoLoggerSystem } from '../logger';

interface BrowserPermissionConfig {
  constraints: DisplayMediaStreamOptions;
  queryName: PermissionName;
}

export type BrowserPermissionState = PermissionState | 'prompting';

export class BrowserPermission {
  private ready: Promise<void>;
  private disposeController = new AbortController();
  private state: BrowserPermissionState | undefined;
  private wasPrompted: boolean = false;
  private listeners = new Set<(state: BrowserPermissionState) => void>();
  private logger = videoLoggerSystem.getLogger('permissions');

  constructor(private readonly permission: BrowserPermissionConfig) {
    const signal = this.disposeController.signal;

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
