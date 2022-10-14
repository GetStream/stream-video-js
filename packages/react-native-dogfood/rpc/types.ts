export type StreamVideoSFUClientOptions = {
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
   * Auth token.
   */
  token: string | (() => string);
};
