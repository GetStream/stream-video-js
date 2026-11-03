import { describe, expect, it } from 'vitest';

import {
  appendDiagnosticsQueryParams,
  getQueryAppId,
} from './ToggleCallDiagnosticsButton';

describe('ToggleCallDiagnosticsButton helpers', () => {
  it('accepts a positive app id from a scalar or repeated query parameter', () => {
    expect(getQueryAppId('1270131')).toBe(1_270_131);
    expect(getQueryAppId(['1270131', 'ignored'])).toBe(1_270_131);
    expect(getQueryAppId('0')).toBeUndefined();
    expect(getQueryAppId('not-a-number')).toBeUndefined();
  });

  it('carries existing call credentials into the diagnostics tab', () => {
    const url = new URL('https://localhost/debug-call/default%3Acall');

    appendDiagnosticsQueryParams(url, {
      api_key: 'api-key',
      environment: 'pronto',
      token: 'user-token',
      user_id: 'user-1',
      coordinator_url: ['ignored-array-value'],
      unrelated: 'ignored',
    });

    expect(Object.fromEntries(url.searchParams)).toEqual({
      api_key: 'api-key',
      environment: 'pronto',
      token: 'user-token',
      user_id: 'user-1',
    });
  });
});
