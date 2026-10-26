/// <reference lib="webworker" />
import { VirtualBackground } from '../VirtualBackground';
import type { FromWorkerMessage, ToWorkerMessage } from './protocol';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

/**
 * Worker entry for the background effect. It must run as a classic worker:
 * tasks-vision loads its WASM loader with importScripts().
 *
 * Inside a Safari worker MediaStreamTrackProcessor and VideoTrackGenerator
 * exist, so the unmodified VirtualBackground pipeline runs here as-is.
 */
const scope = self as unknown as DedicatedWorkerGlobalScope;
const post = (message: FromWorkerMessage, transfer: Transferable[] = []) =>
  scope.postMessage(message, transfer);

const hasTrackApis = () =>
  typeof MediaStreamTrackProcessor !== 'undefined' &&
  typeof (self as { VideoTrackGenerator?: unknown }).VideoTrackGenerator !==
    'undefined';

let processor: VirtualBackground | undefined;
let input: MediaStreamTrack | undefined;

scope.onmessage = async (e: MessageEvent<ToWorkerMessage>) => {
  const message = e.data;
  switch (message.type) {
    case 'start': {
      input = message.track;
      if (!hasTrackApis()) {
        input.stop();
        post({
          type: 'error',
          message:
            'MediaStreamTrackProcessor/VideoTrackGenerator unavailable in workers',
        });
        break;
      }
      try {
        processor = new VirtualBackground(
          input as MediaStreamVideoTrack,
          message.options,
          {
            onStats: (stats) => post({ type: 'stats', stats }),
            onError: (error) =>
              post({ type: 'error', message: messageOf(error) }),
          },
        );
        const output = await processor.start();
        post({ type: 'started', track: output }, [
          output as unknown as Transferable,
        ]);
      } catch (error) {
        post({ type: 'error', message: messageOf(error) });
      }
      break;
    }
    case 'update': {
      // Acknowledged, so the main thread's updateOptions() keeps the
      // main-thread semantics: it settles when the new effect is in place and
      // rejects when e.g. the background image can't be loaded.
      const { id } = message;
      (processor?.updateOptions(message.options) ?? Promise.resolve()).then(
        () => post({ type: 'updated', id }),
        (error) => post({ type: 'updateError', id, message: messageOf(error) }),
      );
      break;
    }
    case 'stop': {
      processor?.stop();
      input?.stop();
      processor = undefined;
      input = undefined;
      post({ type: 'stopped' });
      break;
    }
  }
};
