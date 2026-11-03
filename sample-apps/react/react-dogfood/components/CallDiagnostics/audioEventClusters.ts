import { AudioDiagnosticEvent, AudioDiagnosticEventType } from './rtcStats';

export type OwnedAudioDiagnosticEvent = {
  event: AudioDiagnosticEvent;
  owner?: string;
};

export type AudioEventCluster = {
  id: string;
  entries: OwnedAudioDiagnosticEvent[];
  severity: AudioDiagnosticEvent['severity'];
  timestamp: number;
  endpointCluster: boolean;
};

export const endpointEventClusterWindowMs = 1_500;

const endpointEventTypes = new Set<AudioDiagnosticEventType>([
  'bluetooth-profile',
  'capture-lifecycle',
  'input-device',
  'output-device',
]);

const severityRank: Record<AudioDiagnosticEvent['severity'], number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export const isEndpointAudioEvent = ({ type }: AudioDiagnosticEvent) =>
  endpointEventTypes.has(type);

export const clusterAudioEvents = (
  entries: OwnedAudioDiagnosticEvent[],
  clusterWindowMs = endpointEventClusterWindowMs,
): AudioEventCluster[] => {
  const sorted = [...entries].sort(
    (left, right) => left.event.timestamp - right.event.timestamp,
  );
  const endpointClusters: OwnedAudioDiagnosticEvent[][] = [];

  for (const entry of sorted.filter(({ event }) =>
    isEndpointAudioEvent(event),
  )) {
    const current = endpointClusters.at(-1);
    const previous = current?.at(-1);
    if (
      current &&
      previous &&
      entry.event.timestamp - previous.event.timestamp <= clusterWindowMs
    ) {
      current.push(entry);
    } else {
      endpointClusters.push([entry]);
    }
  }

  const clusters = endpointClusters.map(toCluster);
  const otherEvents = sorted
    .filter(({ event }) => !isEndpointAudioEvent(event))
    .map((entry) => toCluster([entry]));

  return [...clusters, ...otherEvents].sort(
    (left, right) => left.timestamp - right.timestamp,
  );
};

const toCluster = (entries: OwnedAudioDiagnosticEvent[]): AudioEventCluster => {
  const severity = entries.reduce<AudioDiagnosticEvent['severity']>(
    (highest, { event }) =>
      severityRank[event.severity] > severityRank[highest]
        ? event.severity
        : highest,
    'info',
  );
  const timestamp = Math.round(
    entries.reduce((total, { event }) => total + event.timestamp, 0) /
      entries.length,
  );

  return {
    id: entries
      .map(({ event, owner }) => `${owner ?? 'participant'}:${event.id}`)
      .join('|'),
    entries,
    severity,
    timestamp,
    endpointCluster:
      entries.length > 1 || isEndpointAudioEvent(entries[0].event),
  };
};
