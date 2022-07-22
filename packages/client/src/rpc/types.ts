export type StreamVideoClientOptions = {
  /**
   * The baseURL for the RPC calls
   */
  baseUrl?: string;

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
