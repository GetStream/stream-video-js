import { StateStore } from '@stream-io/state-store';
import { field, type Subscribable } from '../store/subscribable';
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

export class BrowserPermission {
  private ready: Promise<void>;
  private disposeController = new AbortController();
  private store = new StateStore<{
    state: BrowserPermissionState | undefined;
  }>({ state: undefined });
  private wasPrompted: boolean = false;
  private logger = videoLoggerSystem.getLogger('permissions');

  /**
   * The current permission state, or `undefined` until it has been determined.
   *
   * Staying `undefined` up front is deliberate: it lets callers await the
   * first real state with `firstValue()`, which skips `undefined` by default.
   */
  readonly state$: Subscribable<BrowserPermissionState | undefined> = field(
    this.store,
    'state',
  );

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
    this.store.partialNext({ state: undefined });
    this.disposeController.abort();
  }

  get state(): BrowserPermissionState | undefined {
    return this.store.getLatestValue().state;
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
   * Calls back with every permission state, starting with the current one if
   * it is already known.
   */
  listen(cb: (state: BrowserPermissionState) => void) {
    const unsubscribe = this.state$.subscribe((state) => {
      if (state) cb(state);
    });
    return () => unsubscribe();
  }

  private setState(state: BrowserPermissionState) {
    if (this.state !== state) {
      const { tracer, queryName } = this.permission;
      const traceKey = `navigator.mediaDevices.${queryName}.permission`;
      tracer?.trace(traceKey, { previous: this.state, state });
      this.store.partialNext({ state });
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
