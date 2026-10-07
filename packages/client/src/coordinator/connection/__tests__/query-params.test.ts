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
