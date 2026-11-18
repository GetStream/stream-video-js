import type { ErrorFromResponse } from '../coordinator/connection/types';

/**
 * The limit that refused a data message: the app's, the sending user's,
 * or the call's (all senders of the call together).
 */
export type CallDataRateLimitScope = 'app' | 'user' | 'call' | 'unknown';

const scopes: Record<string, CallDataRateLimitScope> = {
  app: 'app',
  user: 'user',
  call: 'call',
};

const DEFAULT_RETRY_AFTER_MS = 1000;

/**
 * Thrown by `call.sendData()` when the server refuses a data message because
 * a rate limit was reached. The message was not delivered to anyone.
 * Wait `retryAfterMs` before sending again.
 */
export class CallDataRateLimitError extends Error {
  /** How long to wait before sending again, in milliseconds. */
  readonly retryAfterMs: number;
  /** The limit that refused the message. */
  readonly scope: CallDataRateLimitScope;
  /** The topic of the refused message. */
  readonly topic: string;
  /** The sequence number the refused message was given. */
  readonly seq: number;

  constructor(topic: string, seq: number, cause: ErrorFromResponse<unknown>) {
    super(cause.message, { cause });
    this.name = 'CallDataRateLimitError';
    this.topic = topic;
    this.seq = seq;

    const headers = cause.metadata?.response_headers ?? {};
    const retryAfterSeconds = Number.parseInt(headers['retry-after'], 10);
    this.retryAfterMs =
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : DEFAULT_RETRY_AFTER_MS;
    this.scope =
      scopes[(headers['x-ratelimit-hit-context'] ?? '').toLowerCase()] ??
      'unknown';
  }
}
