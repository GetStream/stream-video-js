import { SfuEvents, SfuModels } from '@stream-io/video-react-sdk';

export type CoordinatorMode = 'off' | 'fail-always' | 'fail-then-succeed';
export type CoordinatorWsMode =
  | 'off'
  | 'fail-always'
  | 'fail-then-succeed'
  | 'auth-error';

type CoordinatorWsFailureKind = 'close' | 'auth-error';
export type WsMode =
  | 'off'
  | 'fail-always'
  | 'fail-then-succeed'
  | 'sfu-full-always'
  | 'sfu-full-then-succeed'
  | 'sfu-unauthenticated'
  | 'sfu-go-away';

type WsFailureKind = 'close' | 'sfu-full' | 'sfu-unauthenticated' | 'go-away';

export type ChaosState = {
  coordinator: { mode: CoordinatorMode; failCount: number; remaining: number };
  coordinatorWs: {
    mode: CoordinatorWsMode;
    failCount: number;
    remaining: number;
  };
  ws: { mode: WsMode; failCount: number; remaining: number };
};

const COORDINATOR_PATTERN = /\/call\/[^/]+\/[^/]+\/join(\?|$)/;
const COORDINATOR_WS_PATTERN = /\/video\/connect(?:\?|$)/;

const isSfuWebSocket = (url: string) => {
  if (!url) return false;
  if (/\/video\/connect(?:\?|$)/.test(url)) return false;
  if (/chat/i.test(url)) return false;
  if (/[?&](cid|user_session_id)=/.test(url)) return true;
  return /sfu|signal/i.test(url);
};

type Listener = () => void;

class ChaosController {
  private state: ChaosState = {
    coordinator: { mode: 'off', failCount: 1, remaining: 0 },
    coordinatorWs: { mode: 'off', failCount: 1, remaining: 0 },
    ws: { mode: 'off', failCount: 1, remaining: 0 },
  };
  private listeners = new Set<Listener>();
  private patched = false;
  private originals: {
    fetch: typeof fetch;
    XMLHttpRequest: typeof XMLHttpRequest;
    WebSocket: typeof WebSocket;
  } | null = null;

  getState = (): ChaosState => structuredClone(this.state);

  subscribe = (cb: Listener): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  setCoordinator = (mode: CoordinatorMode, failCount = 1) => {
    this.state.coordinator = { mode, failCount, remaining: failCount };
    this.applyIfNeeded();
    this.notify();
  };

  setCoordinatorWs = (mode: CoordinatorWsMode, failCount = 1) => {
    this.state.coordinatorWs = { mode, failCount, remaining: failCount };
    this.applyIfNeeded();
    this.notify();
  };

  setWs = (mode: WsMode, failCount = 1) => {
    this.state.ws = { mode, failCount, remaining: failCount };
    this.applyIfNeeded();
    this.notify();
  };

  reset = () => {
    this.state = {
      coordinator: { mode: 'off', failCount: 1, remaining: 0 },
      coordinatorWs: { mode: 'off', failCount: 1, remaining: 0 },
      ws: { mode: 'off', failCount: 1, remaining: 0 },
    };
    this.unpatch();
    this.notify();
  };

  private notify = () => {
    this.listeners.forEach((cb) => cb());
  };

  private isAnyActive = () =>
    this.state.coordinator.mode !== 'off' ||
    this.state.coordinatorWs.mode !== 'off' ||
    this.state.ws.mode !== 'off';

  private applyIfNeeded = () => {
    if (this.isAnyActive()) this.patch();
    else this.unpatch();
  };

  private patch = () => {
    if (this.patched || typeof window === 'undefined') return;
    this.originals = {
      fetch: window.fetch.bind(window),
      XMLHttpRequest: window.XMLHttpRequest,
      WebSocket: window.WebSocket,
    };
    window.fetch = this.makePatchedFetch(this.originals.fetch);
    (window as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      this.makePatchedXHR(this.originals.XMLHttpRequest);
    (window as { WebSocket: typeof WebSocket }).WebSocket =
      this.makePatchedWebSocket(this.originals.WebSocket);
    this.patched = true;
  };

  private unpatch = () => {
    if (!this.patched || !this.originals) return;
    window.fetch = this.originals.fetch;
    (window as { XMLHttpRequest: typeof XMLHttpRequest }).XMLHttpRequest =
      this.originals.XMLHttpRequest;
    (window as { WebSocket: typeof WebSocket }).WebSocket =
      this.originals.WebSocket;
    this.originals = null;
    this.patched = false;
  };

  shouldFailCoordinator = (url: string) => {
    if (!COORDINATOR_PATTERN.test(url)) return false;
    const c = this.state.coordinator;
    if (c.mode === 'off') return false;
    if (c.mode === 'fail-always') return true;
    if (c.mode === 'fail-then-succeed' && c.remaining > 0) {
      c.remaining--;
      this.notify();
      return true;
    }
    return false;
  };

  shouldFailCoordinatorWs = (url: string): CoordinatorWsFailureKind | null => {
    if (!COORDINATOR_WS_PATTERN.test(url)) return null;
    const c = this.state.coordinatorWs;
    if (c.mode === 'off') return null;
    if (c.mode === 'auth-error') return 'auth-error';
    if (c.mode === 'fail-always') return 'close';
    if (c.mode === 'fail-then-succeed' && c.remaining > 0) {
      c.remaining--;
      this.notify();
      return 'close';
    }
    return null;
  };

  shouldFailWs = (url: string): WsFailureKind | null => {
    if (!isSfuWebSocket(url)) return null;
    const w = this.state.ws;
    if (w.mode === 'off') return null;
    if (w.mode === 'fail-always') return 'close';
    if (w.mode === 'sfu-full-always') return 'sfu-full';
    if (w.mode === 'sfu-unauthenticated') return 'sfu-unauthenticated';
    if (w.mode === 'sfu-go-away') {
      // fire once: the migration it triggers opens a new SFU WS, and we must
      // not inject another goAway into that one (otherwise: endless migration).
      if (w.remaining > 0) {
        w.remaining--;
        this.notify();
        return 'go-away';
      }
      return null;
    }
    if (w.mode === 'fail-then-succeed' && w.remaining > 0) {
      w.remaining--;
      this.notify();
      return 'close';
    }
    if (w.mode === 'sfu-full-then-succeed' && w.remaining > 0) {
      w.remaining--;
      this.notify();
      return 'sfu-full';
    }
    return null;
  };

  private makePatchedFetch =
    (orig: typeof fetch): typeof fetch =>
    (input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (this.shouldFailCoordinator(url)) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              code: 9999,
              message: 'Chaos: simulated coordinator 503',
              StatusCode: 503,
              duration: '0ms',
            }),
            {
              status: 503,
              statusText: 'Service Unavailable (chaos)',
              headers: { 'Content-Type': 'application/json' },
            },
          ),
        );
      }
      return orig(input, init);
    };

  private makePatchedXHR = (Orig: typeof XMLHttpRequest) => {
    return class PatchedXHR extends Orig {
      private _chaosUrl?: string;

      open(
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null,
      ): void {
        this._chaosUrl =
          typeof url === 'string' ? url : (url as URL).toString();
        if (async === undefined) {
          super.open(method, url);
        } else {
          super.open(method, url, async, username, password);
        }
      }

      send(body?: Document | XMLHttpRequestBodyInit | null): void {
        if (
          this._chaosUrl &&
          getChaosController().shouldFailCoordinator(this._chaosUrl)
        ) {
          setTimeout(() => {
            const responseBody = JSON.stringify({
              code: 9999,
              message: 'Chaos: simulated coordinator 503',
              StatusCode: 503,
              duration: '0ms',
            });
            const overrides: Record<string, unknown> = {
              readyState: 4,
              status: 503,
              statusText: 'Service Unavailable (chaos)',
              responseText: responseBody,
              response: responseBody,
              responseURL: this._chaosUrl,
              responseType: '',
            };
            for (const [key, value] of Object.entries(overrides)) {
              try {
                Object.defineProperty(this, key, {
                  configurable: true,
                  get: () => value,
                });
              } catch {
                // ignore
              }
            }
            (
              this as unknown as { getAllResponseHeaders: () => string }
            ).getAllResponseHeaders = () =>
              'content-type: application/json\r\n';
            this.dispatchEvent(new Event('readystatechange'));
            this.dispatchEvent(new Event('load'));
            this.dispatchEvent(new Event('loadend'));
          }, 0);
          return;
        }
        super.send(body);
      }
    } as unknown as typeof XMLHttpRequest;
  };

  private makePatchedWebSocket = (Orig: typeof WebSocket) => {
    const Patched = function PatchedWebSocket(
      this: WebSocket,
      url: string | URL,
      protocols?: string | string[],
    ) {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const controller = getChaosController();
      const coordWsFailure = controller.shouldFailCoordinatorWs(urlStr);
      if (coordWsFailure) {
        const ws = new Orig(urlStr, protocols);
        // 4401 carries an auth status on the close; 4000 is a plain open failure.
        const [code, reason] =
          coordWsFailure === 'auth-error'
            ? [4401, 'Chaos: simulated coordinator WS auth error']
            : [4000, 'Chaos: simulated coordinator WS open failure'];
        Promise.resolve().then(() => {
          try {
            ws.close(code, reason);
          } catch {
            // ignore
          }
        });
        return ws;
      }
      const failure = controller.shouldFailWs(urlStr);
      if (failure === 'close') {
        const ws = new Orig(urlStr, protocols);
        Promise.resolve().then(() => {
          try {
            ws.close(4000, 'Chaos: simulated SFU WS open failure');
          } catch {
            // ignore
          }
        });
        return ws;
      }
      if (failure === 'sfu-full') {
        const ws = new Orig(urlStr, protocols);
        injectSfuEventOnJoin(ws, () =>
          buildSfuErrorEvent(
            SfuModels.ErrorCode.SFU_FULL,
            'Chaos: simulated SFU_FULL',
            SfuModels.WebsocketReconnectStrategy.REJOIN,
            true,
          ),
        );
        return ws;
      }
      if (failure === 'sfu-unauthenticated') {
        const ws = new Orig(urlStr, protocols);
        injectSfuEventOnJoin(ws, () =>
          buildSfuErrorEvent(
            SfuModels.ErrorCode.UNAUTHENTICATED,
            'Chaos: simulated UNAUTHENTICATED',
            // unrecoverable: the SDK should fail the join, not retry
            SfuModels.WebsocketReconnectStrategy.DISCONNECT,
            false,
          ),
        );
        return ws;
      }
      if (failure === 'go-away') {
        const ws = new Orig(urlStr, protocols);
        // fire after the join settles so it behaves like a live migration signal
        injectSfuEventOnJoin(ws, buildGoAwayEvent, 1500);
        return ws;
      }
      return new Orig(urlStr, protocols);
    } as unknown as typeof WebSocket;
    Patched.prototype = Orig.prototype;
    Object.setPrototypeOf(Patched, Orig);
    return Patched;
  };
}

const buildSfuErrorEvent = (
  code: SfuModels.ErrorCode,
  message: string,
  reconnectStrategy: SfuModels.WebsocketReconnectStrategy,
  shouldRetry: boolean,
): SfuEvents.SfuEvent =>
  SfuEvents.SfuEvent.create({
    eventPayload: {
      oneofKind: 'error',
      error: {
        error: { code, message, shouldRetry },
        reconnectStrategy,
      },
    },
  });

const buildGoAwayEvent = (): SfuEvents.SfuEvent =>
  SfuEvents.SfuEvent.create({
    eventPayload: {
      oneofKind: 'goAway',
      goAway: { reason: SfuModels.GoAwayReason.REBALANCE },
    },
  });

/**
 * Hooks the WS so that, when the client sends its `joinRequest`, a synthetic
 * SFU event (built by `buildEvent`) is dispatched back to the client once.
 * `delayMs` lets a `goAway` fire after the join has settled.
 */
const injectSfuEventOnJoin = (
  ws: WebSocket,
  buildEvent: () => SfuEvents.SfuEvent,
  delayMs = 0,
) => {
  ws.binaryType = 'arraybuffer';
  const sendOriginal = ws.send.bind(ws);
  let injected = false;
  ws.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    sendOriginal(data);
    if (injected) return;
    let isJoinRequest = false;
    try {
      let bytes: Uint8Array | undefined;
      if (data instanceof ArrayBuffer) {
        bytes = new Uint8Array(data);
      } else if (ArrayBuffer.isView(data)) {
        bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      }
      if (bytes) {
        const req = SfuEvents.SfuRequest.fromBinary(bytes);
        isJoinRequest = req.requestPayload?.oneofKind === 'joinRequest';
      }
    } catch {
      // ignore
    }
    if (!isJoinRequest) return;
    injected = true;
    const payload = SfuEvents.SfuEvent.toBinary(buildEvent());
    const buffer = payload.buffer.slice(
      payload.byteOffset,
      payload.byteOffset + payload.byteLength,
    ) as ArrayBuffer;
    const fire = () => {
      try {
        ws.dispatchEvent(new MessageEvent('message', { data: buffer }));
      } catch {
        // ignore
      }
    };
    if (delayMs > 0) setTimeout(fire, delayMs);
    else Promise.resolve().then(fire);
  };
};

let singleton: ChaosController | null = null;

export const getChaosController = (): ChaosController => {
  if (!singleton) singleton = new ChaosController();
  return singleton;
};
