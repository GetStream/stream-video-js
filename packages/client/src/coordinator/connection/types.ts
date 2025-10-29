import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ConnectedEvent, UserRequest, VideoEvent } from '../../gen/coordinator';
import { AllSfuEvents } from '../../rtc';
import type { ConfigureLoggersOptions, LogLevel } from '@stream-io/logger';

export type UR = Record<string, unknown>;

export type User =
  | (Omit<UserRequest, 'role'> & { type?: 'authenticated' })
  | (Omit<UserRequest, 'role'> & { type: 'guest' })
  | (Omit<UserRequest, 'id' | 'role'> & {
      id?: '!anon';
      type: 'anonymous';
    });

export type UserWithId =
  | (UserRequest & { type?: 'authenticated' })
  | (UserRequest & { type: 'guest' })
  | (UserRequest & {
      id: '!anon';
      type: 'anonymous';
    });

export type { OwnUserResponse } from '../../gen/coordinator';

export type ConnectAPIResponse = Promise<void | ConnectedEvent>;

type ErrorResponseDetails = {
  code: number;
  messages: string[];
};

export type APIErrorResponse = {
  code: number;
  duration: string;
  message: string;
  more_info: string;
  StatusCode: number;
  details?: ErrorResponseDetails;
  unrecoverable?: boolean;
};

export class ErrorFromResponse<T> extends Error {
  public code: number | null;
  public status: number;
  public response: AxiosResponse<T>;
  public name = 'ErrorFromResponse';
  public unrecoverable: boolean | null;

  constructor({
    message,
    code,
    status,
    response,
    unrecoverable,
  }: Pick<
    ErrorFromResponse<T>,
    'message' | 'code' | 'status' | 'response' | 'unrecoverable'
  >) {
    super(message);
    this.code = code;
    this.response = response;
    this.status = status;
    this.unrecoverable = unrecoverable;
  }

  // Vitest helper (serialized errors are too large to read)
  // https://github.com/vitest-dev/vitest/blob/v3.1.3/packages/utils/src/error.ts#L60-L62
  public toJSON() {
    const extra = [
      ['status', this.status],
      ['code', this.code],
      ['unrecoverable', this.unrecoverable],
    ] as const;

    const joinable = [];

    for (const [key, value] of extra) {
      if (typeof value !== 'undefined' && value !== null) {
        joinable.push(`${key}: ${value}`);
      }
    }

    return {
      message: `(${joinable.join(', ')}) - ${this.message}`,
      stack: this.stack,
      name: this.name,
    };
  }
}

export type ConnectionChangedEvent = {
  type: 'connection.changed';
  online: boolean;
};

export type NetworkChangedEvent = {
  type: 'network.changed';
  online: boolean;
};

export type TransportChangedEvent = {
  type: 'transport.changed';
  mode: 'longpoll';
};

export type ConnectionRecoveredEvent = {
  type: 'connection.recovered';
};

export type StreamVideoEvent = (
  | VideoEvent
  | NetworkChangedEvent
  | ConnectionChangedEvent
  | TransportChangedEvent
  | ConnectionRecoveredEvent
) & { received_at?: string | Date };

// TODO: we should use WSCallEvent here but that needs fixing
export type StreamCallEvent = Extract<StreamVideoEvent, { call_cid: string }>;
export type EventTypes = 'all' | VideoEvent['type'];

export type AllClientEventTypes = 'all' | StreamVideoEvent['type'];
export type AllClientEvents = {
  [K in AllClientEventTypes]: Extract<StreamVideoEvent, { type: K }>;
};
export type ClientEventListener<E extends keyof AllClientEvents> = (
  event: AllClientEvents[E],
) => void;

export type AllClientCallEvents = {
  [K in EventTypes]: Extract<VideoEvent, { type: K }>;
};

export type AllCallEvents = AllClientCallEvents & AllSfuEvents;
export type CallEventListener<E extends keyof AllCallEvents> = (
  event: AllCallEvents[E],
) => void;

export type Logger = (
  logLevel: LogLevel,
  message: string,
  ...args: unknown[]
) => void;

export type StreamClientOptions = Partial<AxiosRequestConfig> & {
  /**
   * Used to disable warnings that are triggered by using connectUser or connectAnonymousUser server-side.
   */
  allowServerSideConnect?: boolean;
  axiosRequestConfig?: AxiosRequestConfig;
  /**
   * Base url to use for API
   * such as https://chat-proxy-dublin.stream-io-api.com
   */
  baseURL?: string;
  browser?: boolean;

  /**
   *  @deprecated Use `logOptions` instead.
   *  Custom logger instance used to handle log messages.
   *  Will be removed in a future release.
   */
  logger?: Logger;

  /**
   *  @deprecated Use `logOptions` instead.
   *  Sets the minimum log level for all logs.
   *  Will be removed in a future release.
   */
  logLevel?: LogLevel;

  /**
   * Configuration options where keys are logger scopes.
   * The `default` scope is reserved is used to set defaults for all loggers.
   *
   */
  logOptions?: ConfigureLoggersOptions;

  /**
   * The URL to use for the location hint.
   */
  locationHintUrl?: string;
  /**
   * The default timeout for requesting a location hint.
   */
  locationHintTimeout?: number;
  /**
   * The maximum number of attempts to request a location hint.
   */
  locationHintMaxAttempts?: number;
  /**
   * When true, user will be persisted on client. Otherwise if `connectUser` call fails, then you need to
   * call `connectUser` again to retry.
   * This is mainly useful for chat application working in offline mode, where you will need client.user to
   * persist even if connectUser call fails.
   */
  persistUserOnConnectionFailure?: boolean;

  /**
   * The secret key for the API key. This is only needed for server side authentication.
   */
  secret?: string;

  /**
   * The WebSocket implementation to use. This is mainly useful for testing.
   * In Node.js environment, you can use the `ws` package.
   */
  WebSocketImpl?: typeof WebSocket;

  /**
   * Create Web Worker to initiate timer events like health checks. Can possibly prevent
   * timer throttling issues in inactive browser tabs.
   */
  enableTimerWorker?: boolean;

  /**
   * The client app identifier.
   */
  clientAppIdentifier?: ClientAppIdentifier;

  /**
   * The default timeout for WebSocket connections.
   */
  defaultWsTimeout?: number;

  /**
   * The maximum number of retries to connect a user.
   */
  maxConnectUserRetries?: number;

  /**
   * A callback to be called one the maxUserConnectRetries is exhausted.
   * @param lastError the last error.
   * @param allErrors all errors.
   */
  onConnectUserError?: (lastError: Error, allErrors: Error[]) => void;

  /**
   * When set to true, the incoming calls are rejected when the user is busy in an another call.
   */
  rejectCallWhenBusy?: boolean;
};

export type ClientAppIdentifier = {
  sdkName?: 'react' | 'react-native' | 'plain-javascript' | (string & {});
  sdkVersion?: string;
  app?: string;
  app_version?: string;
  os?: string;
  device_model?: string;
};

export type TokenProvider = () => Promise<string>;
export type TokenOrProvider = null | string | TokenProvider | undefined;

export type BuiltInRejectReason = 'busy' | 'decline' | 'cancel' | 'timeout';
export type RejectReason = BuiltInRejectReason | (string & {});
