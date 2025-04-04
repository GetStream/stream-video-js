import { Tracer } from './Tracer';

export const tracer = new Tracer(null);

if (
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined'
) {
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

  const trace = tracer.trace;
  const target = navigator.mediaDevices;
  for (const method of ['getUserMedia', 'getDisplayMedia'] as const) {
    const original = target[method];
    if (!original) continue;

    target[method] = async function tracedMethod(
      constraints: MediaStreamConstraints,
    ) {
      const tag = `navigator.mediaDevices.${method}`;
      trace(tag, constraints);
      try {
        const stream = await original.call(target, constraints);
        trace(`${tag}OnSuccess`, dumpStream(stream));
        return stream;
      } catch (err) {
        trace(`${tag}OnFailure`, (err as Error).name);
        throw err;
      }
    };
  }
}
