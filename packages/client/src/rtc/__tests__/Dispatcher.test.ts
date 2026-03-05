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

  it('routes events using a dynamic tag selector', () => {
    const dispatcher = new Dispatcher();
    const dynamicListener = vi.fn();
    const wildcardListener = vi.fn();
    const current = { tag: 'tag-1' };

    dispatcher.on('healthCheckResponse', () => current.tag, dynamicListener);
    dispatcher.on('healthCheckResponse', '*', wildcardListener);

    const message: DispatchableMessage<'healthCheckResponse'> = {
      eventPayload: {
        oneofKind: 'healthCheckResponse',
        healthCheckResponse: {} as never,
      },
    };

    dispatcher.dispatch(message, 'tag-1');
    expect(dynamicListener).toHaveBeenCalledTimes(1);
    expect(wildcardListener).toHaveBeenCalledTimes(1);

    current.tag = 'tag-2';
    dispatcher.dispatch(message, 'tag-1');
    expect(dynamicListener).toHaveBeenCalledTimes(1);
    expect(wildcardListener).toHaveBeenCalledTimes(2);

    dispatcher.dispatch(message, 'tag-2');
    expect(dynamicListener).toHaveBeenCalledTimes(2);
    expect(wildcardListener).toHaveBeenCalledTimes(3);
  });

  it('unsubscribes listeners with dynamic tag selectors', () => {
    const dispatcher = new Dispatcher();
    const dynamicListener = vi.fn();
    const current = { tag: 'tag-1' };
    const message: DispatchableMessage<'healthCheckResponse'> = {
      eventPayload: {
        oneofKind: 'healthCheckResponse',
        healthCheckResponse: {} as never,
      },
    };

    const unsubscribe = dispatcher.on(
      'healthCheckResponse',
      () => current.tag,
      dynamicListener,
    );
    dispatcher.dispatch(message, 'tag-1');
    expect(dynamicListener).toHaveBeenCalledTimes(1);

    unsubscribe();
    dispatcher.dispatch(message, 'tag-1');
    expect(dynamicListener).toHaveBeenCalledTimes(1);
  });
});
