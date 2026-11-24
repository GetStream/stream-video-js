import { afterEach, describe, expect, it, vi } from 'vitest';
import { createWebSocketSignalChannel } from '../signal';
import { SfuEvent } from '../../gen/video/sfu/event/events';
import { PeerType } from '../../gen/video/sfu/models/models';
import type { StreamRNVideoSDKGlobals } from '../../types';

const NativeTextDecoder = globalThis.TextDecoder;
const globals = globalThis as { TextDecoder?: unknown };

const sfuEvent: SfuEvent = {
  eventPayload: {
    oneofKind: 'iceTrickle',
    iceTrickle: {
      peerType: PeerType.SUBSCRIBER,
      iceCandidate: '{"candidate":"candidate:1 1 udp 1 10.0.0.1 9 typ host"}',
      sessionId: 'séssion-😀',
    },
  },
};

const receiveOverSignalChannel = (bytes: Uint8Array) => {
  const listeners: Record<string, (e: unknown) => void> = {};
  vi.stubGlobal(
    'WebSocket',
    class {
      binaryType = 'blob';
      addEventListener = (name: string, listener: (e: unknown) => void) => {
        listeners[name] = listener;
      };
    },
  );
  const onMessage = vi.fn();
  createWebSocketSignalChannel({
    endpoint: 'wss://sfu.example.com/ws',
    onMessage,
    tag: 'test',
    tracer: undefined,
  });
  listeners.message({
    data: bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ),
  });
  return onMessage;
};

const provideTextDecoder = () => {
  const native = new NativeTextDecoder('utf-8', { fatal: true });
  const textDecoder = {
    decode: vi.fn((input?: Uint8Array) => native.decode(input)),
  };
  globalThis.streamRNVideoSDK = { textDecoder } as StreamRNVideoSDKGlobals;
  return textDecoder;
};

describe('createWebSocketSignalChannel', () => {
  afterEach(() => {
    globals.TextDecoder = NativeTextDecoder;
    globalThis.streamRNVideoSDK = undefined;
    vi.unstubAllGlobals();
  });

  it('decodes binary events with the global TextDecoder', () => {
    const decode = vi.spyOn(NativeTextDecoder.prototype, 'decode');

    const onMessage = receiveOverSignalChannel(SfuEvent.toBinary(sfuEvent));

    expect(onMessage).toHaveBeenCalledWith(sfuEvent);
    expect(decode).toHaveBeenCalledTimes(2);
    decode.mockRestore();
  });

  it('decodes binary events with the decoder of the React Native SDK', () => {
    const bytes = SfuEvent.toBinary(sfuEvent);
    const textDecoder = provideTextDecoder();
    // Hermes before React Native 0.88
    delete globals.TextDecoder;

    const onMessage = receiveOverSignalChannel(bytes);

    expect(onMessage).toHaveBeenCalledWith(sfuEvent);
    expect(textDecoder.decode).toHaveBeenCalledTimes(2);
  });

  it('does not dispatch an event when the provided decoder rejects a string', () => {
    const bytes = SfuEvent.toBinary(sfuEvent);
    const textDecoder = provideTextDecoder();
    textDecoder.decode.mockImplementation(() => {
      throw new TypeError('The encoded data was not valid UTF-8');
    });

    const onMessage = receiveOverSignalChannel(bytes);

    expect(onMessage).not.toHaveBeenCalled();
  });
});
