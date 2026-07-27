import type { AxiosResponse } from 'axios';
import type { StreamClient } from './client';

export type ResponseMetadata = {
  rateLimit?: {
    rateLimit?: number;
    rateLimitRemaining?: number;
    rateLimitReset?: Date;
  };
  responseHeaders: Record<string, string>;
  responseCode: number;
};

export type StreamResponse<T> = T & {
  metadata: ResponseMetadata;
};

export class ApiClient {
  private readonly streamClient: StreamClient;

  constructor(streamClient: StreamClient) {
    this.streamClient = streamClient;
  }

  sendRequest = async <T>(
    method: string,
    pathTemplate: string,
    pathParams?: Record<string, string>,
    queryParams?: Record<string, unknown>,
    body?: unknown,
    contentType?: string,
  ): Promise<{ body: T; metadata: ResponseMetadata }> => {
    let requestUrl = pathTemplate;
    if (pathParams) {
      Object.keys(pathParams).forEach((paramName) => {
        requestUrl = requestUrl.replaceAll(
          `{${paramName}}`,
          encodeURIComponent(pathParams[paramName]),
        );
      });
    }

    const url = requestUrl.startsWith('/')
      ? (this.streamClient.baseURL ?? '') + requestUrl
      : requestUrl;

    const response = await this.streamClient.doAxiosRequest<T>(
      method.toLowerCase(),
      url,
      body,
      {
        params: queryParams,
        paramsSerializer: queryParamsStringify,
        ...(contentType ? { headers: { 'Content-Type': contentType } } : null),
      },
    );

    return {
      body: response.data,
      metadata: buildResponseMetadata(response),
    };
  };
}

const toStringHeaders = (headers: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (headers && typeof headers === 'object') {
    for (const [key, value] of Object.entries(
      headers as Record<string, unknown>,
    )) {
      if (value != null) out[key] = String(value);
    }
  }
  return out;
};

const queryParamsStringify = (params: Record<string, unknown>): string => {
  const queryParams: string[] = [];

  for (const key in params) {
    const value = params[key];
    if (value == null) continue;

    if (Array.isArray(value)) {
      queryParams.push(`${key}=${encodeURIComponent(value.join(','))}`);
    } else if (value instanceof Date) {
      queryParams.push(`${key}=${encodeURIComponent(value.toISOString())}`);
    } else if (typeof value === 'object') {
      queryParams.push(`${key}=${encodeURIComponent(JSON.stringify(value))}`);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      queryParams.push(`${key}=${encodeURIComponent(value)}`);
    }
  }

  return queryParams.join('&');
};

const buildResponseMetadata = (response: AxiosResponse) => {
  const responseHeaders = toStringHeaders(response.headers);
  const limit = responseHeaders['x-ratelimit-limit'];
  const remaining = responseHeaders['x-ratelimit-remaining'];
  const reset = responseHeaders['x-ratelimit-reset'];
  const rateLimit =
    limit || remaining || reset
      ? {
          rateLimit: limit ? Number(limit) : undefined,
          rateLimitRemaining: remaining ? Number(remaining) : undefined,
          rateLimitReset: reset ? new Date(Number(reset) * 1000) : undefined,
        }
      : undefined;

  return {
    ...(rateLimit ? { rateLimit } : null),
    responseHeaders,
    responseCode: response.status,
  };
};
