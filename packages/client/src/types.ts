import type { TokenOrProvider } from './coordinator/connection/types';

export type StreamVideoClientOptions = {
  /**
   * The baseURL for the API calls.
   */
  baseURL?: string;

  /**
   * Auth token provider.
   */
  token: TokenOrProvider;
};
