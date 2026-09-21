import { describe, expect, it } from 'vitest';
import axios from 'axios';
import { StreamClient } from '../client';
import { stringifyQueryParams } from '../query-params';

describe('stringifyQueryParams', () => {
  it('serializes each kind the way the coordinator decoder reads it', () => {
    const since = new Date('2026-01-02T03:04:05.000Z');

    expect(
      stringifyQueryParams({
        limit: 10,
        watch: true,
        cursor: 'a=b&c',
        members: ['x', 'y'],
        since,
        filter_conditions: { role: { $eq: 'admin' } },
        sort: [{ field: 'user_id', direction: 1 }],
        connection_id: undefined,
        next: null,
      }),
    ).toBe(
      [
        'limit=10',
        'watch=true',
        `cursor=${encodeURIComponent('a=b&c')}`,
        `members=${encodeURIComponent('x,y')}`,
        `since=${encodeURIComponent(since.toISOString())}`,
        `filter_conditions=${encodeURIComponent('{"role":{"$eq":"admin"}}')}`,
        `sort=${encodeURIComponent('[{"field":"user_id","direction":1}]')}`,
      ].join('&'),
    );
  });

  /**
   * Writing the serializer is not enough: it has to be the one axios uses.
   * It was previously handed over per request and silently dropped on the way,
   * so every request fell back to the axios default - `filter_conditions` went
   * out as `filter_conditions[user_id][$eq]=x`, which the coordinator does not
   * read, and filters were applied server-side to nothing.
   *
   * Installed on the instance, it covers the generated client and the
   * hand-written `streamClient.get/post/...` helpers alike.
   */
  it('is the serializer axios actually uses', () => {
    const client = new StreamClient('key', { baseURL: 'https://x.io' });
    const config = (
      client as unknown as { axiosInstance: { defaults: object } }
    ).axiosInstance.defaults;

    expect((config as { paramsSerializer?: unknown }).paramsSerializer).toBe(
      stringifyQueryParams,
    );

    const uri = axios.getUri({
      url: '/p',
      params: { sort: [{ field: 'user_id' }], severity: ['warn', 'error'] },
      ...config,
    });
    expect(decodeURIComponent(uri)).toContain('sort=[{"field":"user_id"}]');
    expect(decodeURIComponent(uri)).toContain('severity=warn,error');
  });
});
