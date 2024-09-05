import { fromEventPattern, map } from 'rxjs';
import { isReactNative } from '../helpers/platforms';
import { getLogger } from '../logger';
import { disposeOfMediaStream } from './devices';
import { withoutConcurrency } from '../helpers/concurrency';

interface BrowserPermissionConfig {
  constraints: DisplayMediaStreamOptions;
  queryName: PermissionName;
}

export class BrowserPermission {
  private ready: Promise<void>;
  private disposeController = new AbortController();
  private state: PermissionState | undefined;
  private wasPrompted: boolean = false;
  private listeners = new Set<(state: PermissionState) => void>();
  private logger = getLogger(['permissions']);

  constructor(private readonly permission: BrowserPermissionConfig) {
    const signal = this.disposeController.signal;

    this.ready = (async () => {
      const assumeGranted = (error?: unknown) => {
        this.setState('granted');
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
        assumeGranted(err);
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
    await withoutConcurrency(
      `permission-prompt-${this.permission.queryName}`,
      async () => {
        if (
          (await this.getState()) !== 'prompt' ||
          (this.wasPrompted && !forcePrompt)
        ) {
          const isGranted = this.state === 'granted';

          if (!isGranted && throwOnNotAllowed) {
            throw new DOMException(
              'Permission was not granted previously, and prompting again is not allowed',
              'NotAllowedError',
            );
          }

          return isGranted;
        }

        try {
          this.wasPrompted = true;
          const stream = await navigator.mediaDevices.getUserMedia(
            this.permission.constraints,
          );
          disposeOfMediaStream(stream);
          return true;
        } catch (e) {
          if (e instanceof DOMException && e.name === 'NotAllowedError') {
            this.logger('info', 'Browser permission was not granted', {
              permission: this.permission,
            });

            if (throwOnNotAllowed) {
              throw e;
            }

            return false;
          }

          this.logger('error', `Failed to getUserMedia`, {
            error: e,
            permission: this.permission,
          });
          throw e;
        }
      },
    );
  }

  listen(cb: (state: PermissionState) => void) {
    this.listeners.add(cb);
    if (this.state) cb(this.state);
    return () => this.listeners.delete(cb);
  }

  asObservable() {
    return fromEventPattern<PermissionState>(
      (handler) => this.listen(handler),
      (handler, unlisten) => unlisten(),
    ).pipe(
      // In some browsers, the 'change' event doesn't reliably emit and hence,
      // permissionState stays in 'prompt' state forever.
      // Typically, this happens when a user grants one-time permission.
      // Instead of checking if a permission is granted, we check if it isn't denied
      map((state) => state !== 'denied'),
    );
  }

  private setState(state: PermissionState) {
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
