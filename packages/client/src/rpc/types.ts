import { CallConfig } from '../config/types';

export type StreamVideoClientOptions = {
  /**
   * The default call configuration. Defaults to "meeting" call configuration.
   */
  callConfig?: CallConfig;
  /**
   * The baseURL for the RPC calls
   */
  coordinatorRpcUrl?: string;

  /**
   * The baseURL for the Coordinator WS endpoint.
   */
  coordinatorWsUrl?: string;

  /**
   * Switch to using JSON messages for RPC calls.
   * Useful for debugging, not recommended for production.
   */
  sendJson?: boolean;

  /**
   * The total number of latency measurements to be performed to a
   * certain edge node before joining a call.
   */
  latencyMeasurementRounds?: number;

  /**
   * Auth token.
   */
  token: string | (() => string);
};
