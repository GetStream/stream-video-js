import { TraceBuffer } from './TraceBuffer';

export const traceBuffer = new TraceBuffer();

if (
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined'
) {
  const trace = traceBuffer.trace;
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

const dumpStream = (stream: MediaStream) => ({
  id: stream.id,
  tracks: stream.getTracks().map((track) => ({
    id: track.id, // unique identifier (GUID) for the track
    kind: track.kind, // `audio` or `video`
    label: track.label, // identified the track source
    enabled: track.enabled, // application can control it
    muted: track.muted, // application cannot control it (read-only)
    readyState: track.readyState, // `live` or `ended`
  })),
});
