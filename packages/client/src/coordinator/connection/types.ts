import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { EVENT_MAP } from './events';
import { StableWSConnection } from './connection';
import { CallResponse, UserResponse } from '../../gen/coordinator';

export type UR = Record<string, unknown>;

export type User = {
  id: string;
  anon?: boolean;
  name?: string;
  role?: string;
  teams?: string[];
  username?: string;
  image?: string;
};

export type OwnUserBase = {
  invisible?: boolean;
  roles?: string[];
};

export type OwnUserResponse = User & UserResponse & OwnUserBase;

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
export type EventTypes = 'all' | keyof typeof EVENT_MAP;
export type Event = {
  type: EventTypes;

  call?: CallResponse;

  received_at?: string | Date;
  online?: boolean;
  mode?: string;
  // TODO OL: add more properties
};

export type EventHandler = (event: Event) => void;
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
