import { TraceBuffer } from './TraceBuffer';
import { dumpStream } from './utils';

export const traceBuffer = new TraceBuffer();
const trace = traceBuffer.trace;

if (
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined'
) {
  const tag = 'navigator.mediaDevices';
  if (navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async function patchedGetUserMedia(
      constraints,
    ) {
      trace(`${tag}.getUserMedia`, null, constraints);
      try {
        const stream = await origGetUserMedia.call(
          navigator.mediaDevices,
          constraints,
        );
        trace(`${tag}.getUserMediaOnSuccess`, null, dumpStream(stream));
        return stream;
      } catch (err) {
        trace(`${tag}.getUserMediaOnFailure`, null, (err as Error).name);
        throw err;
      }
    };
  }

  if (navigator.mediaDevices.getDisplayMedia) {
    const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
    navigator.mediaDevices.getDisplayMedia =
      async function patchedGetDisplayMedia(constraints) {
        trace(`${tag}.getDisplayMedia`, null, constraints);
        try {
          const stream = await origGetDisplayMedia.call(
            navigator.mediaDevices,
            constraints,
          );
          trace(`${tag}.getDisplayMediaOnSuccess`, null, dumpStream(stream));
          return stream;
        } catch (err) {
          trace(`${tag}.getDisplayMediaOnFailure`, null, (err as Error).name);
          throw err;
        }
      };
  }
}
