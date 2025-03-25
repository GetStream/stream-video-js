import { TraceBuffer } from './TraceBuffer';
import { dumpStream } from './utils';

export const traceBuffer = new TraceBuffer();
const trace = traceBuffer.trace;

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  console.log('patching navigator.mediaDevices.getUserMedia');
  const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices,
  );
  const gum: MediaDevices['getUserMedia'] = async function (constraints) {
    const tag = 'navigator.mediaDevices';
    trace(`${tag}.getUserMedia`, null, constraints);
    try {
      const stream = await origGetUserMedia(constraints);
      trace(`${tag}.getUserMediaOnSuccess`, null, dumpStream(stream));
      return stream;
    } catch (err) {
      trace(`${tag}.getUserMediaOnFailure`, null, (err as Error).name);
      throw err;
    }
  };
  navigator.mediaDevices.getUserMedia = gum.bind(navigator.mediaDevices);
}

if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
  const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(
    navigator.mediaDevices,
  );
  const gdm: MediaDevices['getDisplayMedia'] = async function (constraints) {
    const tag = 'navigator.mediaDevices';
    trace(`${tag}.getDisplayMedia`, null, constraints);
    try {
      const stream = await origGetDisplayMedia(constraints);
      trace(`${tag}.getDisplayMediaOnSuccess`, null, dumpStream(stream));
      return stream;
    } catch (err) {
      trace(`${tag}.getDisplayMediaOnFailure`, null, (err as Error).name);
      throw err;
    }
  };
  navigator.mediaDevices.getDisplayMedia = gdm.bind(navigator.mediaDevices);
}
