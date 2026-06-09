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
  return (
    <div className="status-readout">
      <div className="status-readout__row">
        <span className={`status-readout__dot ${enabled ? 'on' : 'off'}`} />
        E2EE {enabled ? 'on' : 'off'} · {transform} · {codec}
        {perf.encodeFps != null && (
          <span className="status-readout__perf">enc {perf.encodeFps}fps</span>
        )}
      </div>

      <div className="status-readout__row">
        <span className="status-readout__label">keys</span>
        {keyStore?.sharedKey && (
          <code title={keyStore.sharedKey.fingerprint}>
            shared #{keyStore.sharedKey.keyIndex}{' '}
            {keyStore.sharedKey.fingerprint}
          </code>
        )}
        {keyStore?.perUserKeys.map((k) => (
          <code key={`${k.userId}:${k.keyIndex}`} title={k.userId}>
            {nameByUserId[k.userId] ?? k.userId.slice(0, 8)} #{k.keyIndex}{' '}
            {k.fingerprint}
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

      {perf.decodeFps.length > 0 && (
        <div className="status-readout__row">
          <span className="status-readout__label">perf</span>
          {perf.decodeFps
            .map(
              (d) =>
                `${nameByUserId[d.userId] ?? d.userId.slice(0, 8)} ${d.fps}`,
            )
            .join(' · ')}
        </div>
      )}
    </div>
  );
};
