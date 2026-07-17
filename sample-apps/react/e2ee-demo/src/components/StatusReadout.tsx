import type { HarnessParticipant } from '../harness/snapshot';
import './StatusReadout.css';

const fmtNames = (ids: string[], lookup: Record<string, string>): string =>
  ids.length ? ids.map((id) => lookup[id] ?? id.slice(0, 8)).join(', ') : '-';

interface Props {
  participant: HarnessParticipant;
  nameByUserId: Record<string, string>;
}

export const StatusReadout = ({ participant, nameByUserId }: Props) => {
  const { enabled, transform, codec, keyStore, tracks, perf } = participant;
  const nameOf = (userId: string) => nameByUserId[userId] ?? userId.slice(0, 8);
  // The worker rebuilds its stats maps every report interval, so array order is
  // non-deterministic. Sort by stable keys so rows do not swap places between
  // reports and are easy to track.
  const encodeRows = [...perf.encode].sort(
    (a, b) =>
      a.trackType.localeCompare(b.trackType) || a.codec.localeCompare(b.codec),
  );
  const decodeRows = [...perf.decode].sort(
    (a, b) =>
      nameOf(a.userId).localeCompare(nameOf(b.userId)) ||
      a.trackType.localeCompare(b.trackType),
  );
  const perUserKeys = [...(keyStore?.perUserKeys ?? [])].sort(
    (a, b) =>
      nameOf(a.userId).localeCompare(nameOf(b.userId)) ||
      a.keyIndex - b.keyIndex,
  );
  return (
    <div className="status-readout">
      <div className="status-readout__row">
        <span className={`status-readout__dot ${enabled ? 'on' : 'off'}`} />
        E2EE {enabled ? 'on' : 'off'} · {transform} · {codec}
      </div>

      <div className="status-readout__row">
        <span className="status-readout__label">keys</span>
        {keyStore?.sharedKey && (
          <code title={keyStore.sharedKey.fingerprint}>
            shared #{keyStore.sharedKey.keyIndex}{' '}
            {keyStore.sharedKey.fingerprint}
          </code>
        )}
        {perUserKeys.map((k) => (
          <code key={`${k.userId}:${k.keyIndex}`} title={k.userId}>
            {nameOf(k.userId)} #{k.keyIndex} {k.fingerprint}
          </code>
        ))}
        {!keyStore?.sharedKey && !keyStore?.perUserKeys.length && (
          <span className="status-readout__muted">none</span>
        )}
      </div>

      <div className="status-readout__row">
        <span className="status-readout__label">tracks</span>
        enc {tracks.encrypting ? '✓' : '✗'} · dec{' '}
        {fmtNames(tracks.decryptingFrom, nameByUserId)}
        {tracks.failingFrom.length > 0 && (
          <span className="status-readout__fail">
            · fail {fmtNames(tracks.failingFrom, nameByUserId)}
          </span>
        )}
      </div>

      {encodeRows.length > 0 && (
        <div className="status-readout__row">
          <span className="status-readout__label">encode</span>
          {encodeRows.map((e) => (
            <span key={e.trackType} className="status-readout__perf">
              {e.trackType.toLowerCase()} ({e.codec}) {Math.round(e.fps)}fps
              {e.maxCryptoMs > 0 && ` · ${e.maxCryptoMs.toFixed(1)}ms`}
            </span>
          ))}
        </div>
      )}

      {decodeRows.length > 0 && (
        <div className="status-readout__row">
          <span className="status-readout__label">decode</span>
          {decodeRows.map((d) => (
            <span
              key={`${d.userId}:${d.trackType}`}
              className="status-readout__perf"
            >
              {nameOf(d.userId)} {d.trackType.toLowerCase()} {Math.round(d.fps)}
              fps
              {d.maxCryptoMs > 0 && ` · ${d.maxCryptoMs.toFixed(1)}ms`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
