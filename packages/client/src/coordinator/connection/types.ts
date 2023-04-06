import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { StableWSConnection } from './connection';
import {
  CallResponse,
  HealthCheckEvent,
  OwnUserResponse,
  WSEvent,
} from '../../gen/coordinator';

export type UR = Record<string, unknown>;

export type User = {
  id: string;
  anon?: boolean;
  name?: string;
  role?: string;
  teams?: string[];
  username?: string;
  image?: string;
  custom?: { [key: string]: any };
};

export type { OwnUserResponse } from '../../gen/coordinator';

export type ConnectionOpen = {
  connection_id: string;
  cid?: string;
  created_at?: string;
  me?: OwnUserResponse;
  type?: string;
};

export type ConnectAPIResponse = Promise<void | ConnectionOpen>;

export type LogLevel = 'info' | 'error' | 'warn';

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

type ClientEventTypes = 'health.check';

type LocalEventTypes =
  | 'connection.changed'
  | 'transport.changed'
  | 'connection.recovered';

export type EventTypes = 'all' | WSEvent['type'] | LocalEventTypes;

export type CallEventTypes = Exclude<
  EventTypes,
  'all' | ClientEventTypes | LocalEventTypes
>;

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
  | WSEvent
  | ConnectionChangedEvent
  | TransportChangedEvent
  | ConnectionRecoveredEvent
) & { received_at?: string | Date };

export type StreamCallEvent = Exclude<
  Event,
  | HealthCheckEvent
  | ConnectionChangedEvent
  | TransportChangedEvent
  | ConnectionRecoveredEvent
>;

export type EventHandler = (event: StreamVideoEvent) => void;

export type CallEventHandler = (event: StreamCallEvent) => void;

export type Logger = (
  logLevel: LogLevel,
  message: string,
  extraData?: Record<string, unknown>,
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
};

export type TokenProvider = () => Promise<string>;
export type TokenOrProvider = null | string | TokenProvider | undefined;

// FIXME: have this coming from OpenAPI schema
const OwnCapabilitiesEnum = [
  'join-call',
  'stop-record-call',
  'end-call',
  'mute-users',
  'start-broadcast-call',
  'block-users',
  'read-call',
  'join-ended-call',
  'screenshare',
  'send-video',
  'send-audio',
  'start-record-call',
  'update-call-permissions',
  'create-call',
  'update-call',
  'update-call-settings',
  'stop-broadcast-call',
] as const;

export type OwnCapabilities = Array<(typeof OwnCapabilitiesEnum)[number]>;
