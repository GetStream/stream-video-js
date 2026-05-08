import { vi } from 'vitest';
import type { ScopedLogger } from '../../../../logger';

/**
 * Minimal Logger fake for unit tests. Returns the same instance from
 * `withExtraTags` so chained tag calls do not allocate. Each level method is a
 * `vi.fn()` so tests can assert on calls.
 */
export const createFakeLogger = (): ScopedLogger => {
  const logger = {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    getLogLevel: () => 'trace' as const,
    withExtraTags: () => logger,
  };
  return logger as unknown as ScopedLogger;
};
