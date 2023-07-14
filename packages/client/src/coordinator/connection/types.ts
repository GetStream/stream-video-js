import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { StableWSConnection } from './connection';
import { ConnectedEvent, UserRequest, VideoEvent } from '../../gen/coordinator';

export type UR = Record<string, unknown>;

export type User =
  | (UserRequest & { type?: 'authenticated' })
  | (UserRequest & { type: 'guest' })
  | (Omit<UserRequest, 'id'> & {
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

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

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
};

export class ErrorFromResponse<T> extends Error {
  code?: number;
  response?: AxiosResponse<T>;
  status?: number;
}

export type ConnectionChangedEvent = {
  type: 'connection.changed';
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
  | ConnectionChangedEvent
  | TransportChangedEvent
  | ConnectionRecoveredEvent
) & { received_at?: string | Date };

// TODO: we should use WSCallEvent here but that needs fixing
export type StreamCallEvent = Extract<StreamVideoEvent, { call_cid: string }>;

export type EventHandler = (event: StreamVideoEvent) => void;

export type CallEventHandler = (event: StreamCallEvent) => void;

export type EventTypes = 'all' | StreamVideoEvent['type'];

export type CallEventTypes = StreamCallEvent['type'];

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
  // device?: BaseDeviceFields;
  enableInsights?: boolean;
  /** experimental feature, please contact support if you want this feature enabled for you */
  enableWSFallback?: boolean;
  logger?: Logger;
  logLevel?: LogLevel;
  /**
   * The default timeout for requesting a location hint.
   */
  locationHintTimeout?: number;
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

  warmUp?: boolean;
  // Set the instance of StableWSConnection on chat client. Its purely for testing purpose and should
  // not be used in production apps.
  wsConnection?: StableWSConnection;
  /**
   * The preferred video codec to use.
   */
  preferredVideoCodec?: string;
};

export type TokenProvider = () => Promise<string>;
export type TokenOrProvider = null | string | TokenProvider | undefined;
