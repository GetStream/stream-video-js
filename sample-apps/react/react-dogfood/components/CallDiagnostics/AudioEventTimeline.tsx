import { useMemo } from 'react';

import {
  clusterAudioEvents,
  isEndpointAudioEvent,
  OwnedAudioDiagnosticEvent,
} from './audioEventClusters';

export type AudioEventTimelineProps = {
  ariaLabel: string;
  entries: OwnedAudioDiagnosticEvent[];
  maxTimestamp: number;
  minTimestamp: number;
};

const maxVisibleEndpointEvents = 8;

export const AudioEventTimeline = ({
  ariaLabel,
  entries,
  maxTimestamp,
  minTimestamp,
}: AudioEventTimelineProps) => {
  const clusters = useMemo(() => clusterAudioEvents(entries), [entries]);
  const endpointEntries = useMemo(
    () =>
      entries
        .filter(({ event }) => isEndpointAudioEvent(event))
        .sort((left, right) => left.event.timestamp - right.event.timestamp),
    [entries],
  );
  const visibleEndpointEntries = endpointEntries.slice(
    -maxVisibleEndpointEvents,
  );
  const duration = Math.max(1, maxTimestamp - minTimestamp);
  const showsOwner = visibleEndpointEntries.some(({ owner }) => owner);

  return (
    <>
      <div aria-label={ariaLabel} className="rd__call-diagnostics__event-rail">
        {clusters.map((cluster) => {
          const first = cluster.entries[0];
          const isCluster = cluster.entries.length > 1;
          const label = isCluster
            ? `${cluster.entries.length} endpoint events around ${formatTimestamp(cluster.timestamp)}`
            : `${first.owner ? `${first.owner}: ` : ''}${first.event.label} at ${formatTimestamp(first.event.timestamp)}`;

          return (
            <span
              aria-label={label}
              className={`rd__call-diagnostics__event-marker is-${cluster.severity}${isCluster ? ' is-cluster' : ''}${cluster.endpointCluster ? ' is-endpoint' : ''}`}
              data-label={label}
              key={cluster.id}
              role="img"
              style={{
                left: `${Math.min(100, Math.max(0, ((cluster.timestamp - minTimestamp) / duration) * 100))}%`,
              }}
            >
              {isCluster && <b>{cluster.entries.length}</b>}
            </span>
          );
        })}
      </div>

      {visibleEndpointEntries.length > 0 && (
        <section
          aria-label="Endpoint change details"
          className="rd__call-diagnostics__endpoint-log"
        >
          <header>
            <strong>Endpoint changes</strong>
            <span>
              {endpointEntries.length}{' '}
              {endpointEntries.length === 1 ? 'event' : 'events'}
              {endpointEntries.length > maxVisibleEndpointEvents
                ? ` · latest ${maxVisibleEndpointEvents}`
                : ''}
            </span>
          </header>
          <div className="rd__call-diagnostics__endpoint-events">
            {visibleEndpointEntries.map(({ event, owner }) => (
              <div
                className={`rd__call-diagnostics__endpoint-event${showsOwner ? ' has-owner' : ''}`}
                key={`${owner ?? 'participant'}:${event.id}`}
              >
                <time dateTime={new Date(event.timestamp).toISOString()}>
                  {formatTimestamp(event.timestamp)}
                </time>
                {showsOwner && <strong>{owner ?? '—'}</strong>}
                <b>{event.label}</b>
                <span>{event.detail || 'No additional browser evidence'}</span>
                <em className={`is-${event.severity}`}>
                  {formatEventImpact(event.severity)}
                </em>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
};

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
});

const formatTimestamp = (timestamp: number) => timeFormatter.format(timestamp);

const formatEventImpact = (
  severity: OwnedAudioDiagnosticEvent['event']['severity'],
) => {
  if (severity === 'critical') return 'Interrupted';
  if (severity === 'warning') return 'Transition';
  return 'Observed';
};

export default AudioEventTimeline;
