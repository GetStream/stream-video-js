import { Tracer } from './Tracer';

export const tracer = new Tracer();

if (
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined'
) {
  const trace = tracer.trace;
  const tag = 'navigator.mediaDevices';

  if (navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = async function tracedGetUserMedia(
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
      async function tracedGetDisplayMedia(constraints) {
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

const dumpStream = (stream: MediaStream) => ({
  id: stream.id,
  tracks: stream.getTracks().map((track) => ({
    id: track.id,
    kind: track.kind,
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
  })),
});
