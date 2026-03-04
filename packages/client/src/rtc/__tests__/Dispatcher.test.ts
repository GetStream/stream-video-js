import { describe, expect, it, vi } from 'vitest';
import { DispatchableMessage, Dispatcher } from '../Dispatcher';

describe('Dispatcher', () => {
  it('routes events to tag listeners and wildcard listeners', () => {
    const dispatcher = new Dispatcher();
    const taggedListener = vi.fn();
    const wildcardListener = vi.fn();

    dispatcher.on('healthCheckResponse', 'tag-1', taggedListener);
    dispatcher.on('healthCheckResponse', '*', wildcardListener);

    const message: DispatchableMessage<'healthCheckResponse'> = {
      eventPayload: {
        oneofKind: 'healthCheckResponse',
        healthCheckResponse: {} as never,
      },
    };

    dispatcher.dispatch(message, 'tag-1');
    expect(taggedListener).toHaveBeenCalledTimes(1);
    expect(wildcardListener).toHaveBeenCalledTimes(1);

    dispatcher.dispatch(message, 'tag-2');
    expect(taggedListener).toHaveBeenCalledTimes(1);
    expect(wildcardListener).toHaveBeenCalledTimes(2);
  });
});
