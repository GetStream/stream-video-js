import type { AxiosResponse } from 'axios';
import type { StreamClient } from './client';

/**
 * Rate-limit state reported by the coordinator on every response.
 *
 * `rate_limit_reset` is a `Date` rather than a wire timestamp: it is built here
 * from the `x-ratelimit-reset` header, not read off a response body, so it never
 * goes through the unix-nanosecond convention the API uses for its own dates.
 */
export type RateLimit = {
  rate_limit?: number;
  rate_limit_remaining?: number;
  rate_limit_reset?: Date;
};

/**
 * Per-request metadata attached to every generated API response.
 *
 * Field names match `stream-chat` and `@stream-io/feeds-client` exactly — the
 * same envelope across all three SDKs is worth more than a naming preference.
 */
export type RequestMetadata = {
  response_headers: Record<string, string>;
  rate_limit: RateLimit;
  response_code: number;
  client_request_id: string;
};

export type StreamResponse<T> = T & {
  metadata: RequestMetadata;
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Adapter between the generated API classes and {@link StreamClient}.
 *
 * It delegates rather than owning transport: HTTP auth is coupled to the live
 * WebSocket through `connection_id`, so `StreamClient` keeps auth, token
 * refresh, reconnection and error wrapping.
 *
 * `sendRequest` returns the flattened `StreamResponse<T>`, not the
 * `{ body, metadata }` pair stream-chat and feeds use. Their generated methods
 * need the raw body to run a per-model date decoder on it; this spec types every
 * response date as a number, so there are no decoders and the generator emits
 * each method as `return this.apiClient.sendRequest<T>(...)`. The envelope is
 * built once, here. If the spec ever gains a decodable date the generated
 * methods go back to expecting `{ body, metadata }` and this return type stops
 * compiling — see generate-openapi.sh.
 *
 * The positional signature is the generator's calling convention; keep it.
 */
export class ApiClient {
  private readonly streamClient: StreamClient;

  constructor(streamClient: StreamClient) {
    this.streamClient = streamClient;
  }

  sendRequest = async <T>(
    method: HttpMethod,
    pathTemplate: string,
    pathParams?: Record<string, string>,
    queryParams?: Record<string, unknown>,
    body?: unknown,
    contentType?: string,
  ): Promise<StreamResponse<T>> => {
    const response = await this.streamClient.doAxiosRequest<T>(
      method.toLowerCase(),
      buildRequestUrl(
        this.streamClient.baseURL ?? '',
        pathTemplate,
        pathParams,
      ),
      body,
      {
        params: queryParams,
        headers: contentType ? { 'Content-Type': contentType } : undefined,
      },
    );

    return { ...response.data, metadata: buildRequestMetadata(response) };
  };
}

/** Fills `{param}` placeholders and prefixes the coordinator base URL. */
const buildRequestUrl = (
  baseURL: string,
  pathTemplate: string,
  pathParams: Record<string, string> = {},
): string => {
  const path = Object.entries(pathParams).reduce(
    (acc, [name, value]) =>
      acc.replaceAll(`{${name}}`, encodeURIComponent(value)),
    pathTemplate,
  );
  return baseURL + path;
};

const buildRequestMetadata = (response: AxiosResponse): RequestMetadata => {
  const responseHeaders = toStringRecord(response.headers);
  const requestHeaders = toStringRecord(response.config?.headers);

  const rateLimit: RateLimit = {};
  const limit = parseInteger(responseHeaders['x-ratelimit-limit']);
  if (limit !== undefined) rateLimit.rate_limit = limit;
  const remaining = parseInteger(responseHeaders['x-ratelimit-remaining']);
  if (remaining !== undefined) rateLimit.rate_limit_remaining = remaining;
  const reset = parseInteger(responseHeaders['x-ratelimit-reset']);
  if (reset !== undefined) rateLimit.rate_limit_reset = new Date(reset * 1000);

  return {
    response_headers: responseHeaders,
    rate_limit: rateLimit,
    response_code: response.status,
    client_request_id: requestHeaders['x-client-request-id'] ?? '',
  };
};

const toStringRecord = (headers: unknown): Record<string, string> => {
  if (!headers || typeof headers !== 'object') return {};
  return Object.fromEntries(
    Object.entries(headers)
      .filter(([, value]) => value != null)
      .map(([key, value]) => [key, String(value)]),
  );
};

const parseInteger = (value: string | undefined): number | undefined => {
  if (value === undefined) return undefined;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
