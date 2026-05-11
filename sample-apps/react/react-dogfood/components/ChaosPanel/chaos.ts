import { SfuEvents, SfuModels } from '@stream-io/video-react-sdk';

export type CoordinatorMode = 'off' | 'fail-always' | 'fail-then-succeed';
export type WsMode =
  | 'off'
  | 'fail-always'
  | 'fail-then-succeed'
  | 'sfu-full-always'
  | 'sfu-full-then-succeed';

type WsFailureKind = 'close' | 'sfu-full';

export type ChaosState = {
  coordinator: { mode: CoordinatorMode; failCount: number; remaining: number };
  ws: { mode: WsMode; failCount: number; remaining: number };
};

const COORDINATOR_PATTERN = /\/call\/[^/]+\/[^/]+\/join(\?|$)/;

/**
 * Heuristic for "this WebSocket URL looks like an SFU media-plane signal
 * channel." Excludes the coordinator's presence/event WS (`/video/connect`),
 * chat sockets, and anything else that doesn't carry SFU-specific query
 * params.
 *
 * The SFU WS URL is constructed in `StreamSfuClient.createWebSocket()` with
 * params `user_id`, `api_key`, `user_session_id`, `cid`, `attempt`. The
 * `cid=` and `user_session_id=` params are unique to it.
 */
const isSfuWebSocket = (url: string) => {
  if (!url) return false;
  // Coordinator presence/event channel — never intercept this.
  if (/\/video\/connect(?:\?|$)/.test(url)) return false;
  // Chat and other Stream transports — skip.
  if (/chat/i.test(url)) return false;
  // SFU-specific query params confirm this is the media-plane signal WS.
  if (/[?&](cid|user_session_id)=/.test(url)) return true;
  // Last-resort heuristic for older / custom SFU URLs.
  return /sfu|signal/i.test(url);
};

type Listener = () => void;

class ChaosController {
  private state: ChaosState = {
    coordinator: { mode: 'off', failCount: 1, remaining: 0 },
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

  setWs = (mode: WsMode, failCount = 1) => {
    this.state.ws = { mode, failCount, remaining: failCount };
    this.applyIfNeeded();
    this.notify();
  };

  reset = () => {
    this.state = {
      coordinator: { mode: 'off', failCount: 1, remaining: 0 },
      ws: { mode: 'off', failCount: 1, remaining: 0 },
    };
    this.unpatch();
    this.notify();
  };

  private notify = () => {
    this.listeners.forEach((cb) => cb());
  };

  private isAnyActive = () =>
    this.state.coordinator.mode !== 'off' || this.state.ws.mode !== 'off';

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

  shouldFailWs = (url: string): WsFailureKind | null => {
    if (!isSfuWebSocket(url)) return null;
    const w = this.state.ws;
    if (w.mode === 'off') return null;
    if (w.mode === 'fail-always') return 'close';
    if (w.mode === 'sfu-full-always') return 'sfu-full';
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
          // Surface a synthetic HTTP 503 response. XHR's `readyState`,
          // `status`, etc. are read-only getters on the prototype, so we
          // shadow them with instance-level data properties (defined as
          // getters via `Object.defineProperty`) before dispatching the
          // load / readystatechange events that axios listens for.
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
              } catch {}
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
      const failure = getChaosController().shouldFailWs(urlStr);
      if (failure === 'close') {
        const ws = new Orig(urlStr, protocols);
        Promise.resolve().then(() => {
          try {
            ws.close(4000, 'Chaos: simulated SFU WS open failure');
          } catch {
            /* ignore */
          }
        });
        return ws;
      }
      if (failure === 'sfu-full') {
        const ws = new Orig(urlStr, protocols);
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
              bytes = new Uint8Array(
                data.buffer,
                data.byteOffset,
                data.byteLength,
              );
            }
            if (bytes) {
              const req = SfuEvents.SfuRequest.fromBinary(bytes);
              isJoinRequest = req.requestPayload?.oneofKind === 'joinRequest';
            }
          } catch {
            /* not a decodable SfuRequest, ignore */
          }
          if (!isJoinRequest) return;
          injected = true;
          const errorEvent = SfuEvents.SfuEvent.create({
            eventPayload: {
              oneofKind: 'error',
              error: {
                error: {
                  code: SfuModels.ErrorCode.SFU_FULL,
                  message: 'Chaos: simulated SFU_FULL',
                  shouldRetry: true,
                },
                reconnectStrategy: SfuModels.WebsocketReconnectStrategy.REJOIN,
              },
            },
          });
          const payload = SfuEvents.SfuEvent.toBinary(errorEvent);
          const buffer = payload.buffer.slice(
            payload.byteOffset,
            payload.byteOffset + payload.byteLength,
          ) as ArrayBuffer;
          // Deliver on the next microtask so the SDK's send returns first.
          Promise.resolve().then(() => {
            try {
              ws.dispatchEvent(new MessageEvent('message', { data: buffer }));
            } catch {
              /* ignore */
            }
          });
        };
        return ws;
      }
      return new Orig(urlStr, protocols);
    } as unknown as typeof WebSocket;
    Patched.prototype = Orig.prototype;
    Object.setPrototypeOf(Patched, Orig);
    return Patched;
  };
}

let singleton: ChaosController | null = null;

export const getChaosController = (): ChaosController => {
  if (!singleton) singleton = new ChaosController();
  return singleton;
};
