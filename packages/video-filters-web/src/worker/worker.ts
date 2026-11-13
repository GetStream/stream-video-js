/// <reference lib="webworker" />
/**
 * Worker entry for the background effect. It runs as a classic worker
 * because tasks-vision loads its WASM with importScripts(). Safari exposes
 * MediaStreamTrackProcessor and VideoTrackGenerator inside workers,
 * so the regular VirtualBackground pipeline runs here unchanged.
 */
import { VirtualBackground } from '../VirtualBackground';
import type { FromWorkerMessage, ToWorkerMessage } from './protocol';

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

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
