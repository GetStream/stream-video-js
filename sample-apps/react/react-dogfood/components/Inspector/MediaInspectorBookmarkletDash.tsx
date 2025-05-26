export function MediaInspectorBookmarkletDash() {
  return (
    <div className="rd__inspector-dash rd__inspector-dash_wide">
      <h3>Media Inspector Bookmarklet</h3>
      <section>
        Drag and drop this link to your bookmark bar:{' '}
        <a
          className="rd__inspector-bookmarklet"
          href={`javascript:${encodeURIComponent(`(${mediaInspectorBookmarklet.toString()})()`)}`}
        >
          Media Inspector ⤴️
        </a>
        .
      </section>
      <section>
        <small>
          Running this bookmarklet makes _inspectMedia global function availble.
          It can give you some hints why camera or microphone devices are in
          use.
        </small>
      </section>
    </div>
  );
}

type MediaInspectorRecord = readonly [
  ms: MediaStream,
  contraints: MediaStreamConstraints,
  err: Error,
];

function mediaInspectorBookmarklet() {
  if ('__inspectMedia' in window) {
    console.log('[media inspector] Already installed');
  }

  const registry: MediaInspectorRecord[] = [];
  const md = navigator.mediaDevices;
  const gum = md.getUserMedia;
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    const ms = await gum.call(md, constraints);
    const err = new Error('[media inspector] Inspect stack trace');
    const record = [ms, constraints ?? {}, err] as const;
    registry.push(record);
    ms.getTracks().forEach((t) => {
      t.addEventListener('ended', () => {
        console.log(
          '[media inspector]',
          `Track "${t.kind}" ended`,
          formatRecord(record),
        );
      });
      const stop = t.stop;
      t.stop = () => {
        console.log(
          '[media inspector]',
          `Track "${t.kind}" stopped`,
          formatRecord(record),
        );
        return stop.call(t);
      };
    });
    return ms;
  };
  const formatRecord = (r: MediaInspectorRecord) => {
    const record: Array<any> & { trace?: () => void } = [
      r[0],
      r[1],
      r[0].active ? 'live' : 'ended',
    ];
    record.trace = () => {
      throw r[2];
    };
    return record;
  };
  window._inspectMedia = () => registry.map(formatRecord);
}
