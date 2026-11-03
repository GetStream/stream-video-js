import {
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

import {
  getInboundAudioForPublisher,
  ParticipantDiagnostics,
} from './rtcStats';
import AudioEventTimeline from './AudioEventTimeline';
import { OwnedAudioDiagnosticEvent } from './audioEventClusters';

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend);

export type AudioFanoutChartParticipant = {
  label: string;
  userId: string;
  userSessionId: string;
  samples: ParticipantDiagnostics[];
};

export type AudioFanoutChartProps = {
  source: AudioFanoutChartParticipant;
  receivers: AudioFanoutChartParticipant[];
};

const receiverColors = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
];

export const AudioFanoutChart = ({
  source,
  receivers,
}: AudioFanoutChartProps) => {
  const data = useMemo<ChartData<'line'>>(
    () => ({
      datasets: [
        {
          label: `${source.label} outbound`,
          data: source.samples.flatMap((sample) =>
            sample.publishAudioPacketsPerSecond === undefined
              ? []
              : [
                  {
                    x: sample.updatedAt,
                    y: sample.publishAudioPacketsPerSecond,
                  },
                ],
          ),
          borderColor: '#00e2a1',
          backgroundColor: '#00e2a1',
          pointRadius: source.samples.length > 60 ? 0 : 2,
          pointHoverRadius: 4,
          borderWidth: 3,
          tension: 0.2,
        },
        ...receivers.map((receiver, index) => ({
          label: receiver.label,
          data: receiver.samples.flatMap((sample) => {
            const audio = getInboundAudioForPublisher(
              sample,
              source.userId,
              source.userSessionId,
            );
            return audio?.packetsPerSecond === undefined
              ? []
              : [{ x: sample.updatedAt, y: audio.packetsPerSecond }];
          }),
          borderColor: receiverColors[index % receiverColors.length],
          backgroundColor: receiverColors[index % receiverColors.length],
          pointRadius: receiver.samples.length > 60 ? 0 : 2,
          pointHoverRadius: 4,
          borderWidth: 2,
          tension: 0.2,
        })),
      ],
    }),
    [receivers, source],
  );
  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      animation: false,
      maintainAspectRatio: false,
      normalized: true,
      parsing: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            title: (items) =>
              typeof items[0]?.parsed.x === 'number'
                ? formatTimestamp(items[0].parsed.x)
                : '',
            label: (item) =>
              `${item.dataset.label}: ${formatValue(item.parsed.y)} packets/s`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          grid: { display: false },
          title: { display: true, text: 'Time' },
          ticks: {
            maxTicksLimit: 6,
            callback: (value) => formatTimestamp(Number(value)),
          },
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Audio packets/s' },
          ticks: { callback: (value) => formatValue(Number(value)) },
        },
      },
    }),
    [],
  );
  const events = useMemo(
    () => collectEvents(source, receivers),
    [receivers, source],
  );
  const timestamps = [
    ...source.samples.map(({ updatedAt }) => updatedAt),
    ...receivers.flatMap(({ samples }) =>
      samples.map(({ updatedAt }) => updatedAt),
    ),
    ...events.map(({ event }) => event.timestamp),
  ];
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);

  return (
    <section className="rd__call-diagnostics__fanout-chart">
      <div className="rd__call-diagnostics__fanout-chart-title">
        <div>
          <h3>Publisher and receiver packet flow</h3>
          <p>
            All paths use the same time axis. Audio events are pinned above it.
          </p>
        </div>
      </div>
      <AudioEventTimeline
        ariaLabel="Audio endpoint and processing events over time"
        entries={events}
        maxTimestamp={maxTimestamp}
        minTimestamp={minTimestamp}
      />
      <div className="rd__call-diagnostics__fanout-chart-canvas">
        <Line
          aria-label={`Audio packet flow from ${source.label} to all receivers over time`}
          data={data}
          options={options}
          role="img"
        />
      </div>
    </section>
  );
};

export default AudioFanoutChart;

const collectEvents = (
  source: AudioFanoutChartParticipant,
  receivers: AudioFanoutChartParticipant[],
) => {
  const all = [source, ...receivers].flatMap((participant) =>
    participant.samples.flatMap((sample) =>
      sample.audioEvents.map((event) => ({ event, owner: participant.label })),
    ),
  );
  const unique = new Map<string, OwnedAudioDiagnosticEvent>();
  all.forEach((entry) => unique.set(`${entry.owner}:${entry.event.id}`, entry));
  return [...unique.values()]
    .sort((a, b) => a.event.timestamp - b.event.timestamp)
    .slice(-20);
};

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const formatTimestamp = (timestamp: number) => timeFormatter.format(timestamp);

const formatValue = (value: number | null) => {
  if (value === null) return '—';
  return Math.abs(value) >= 100
    ? Math.round(value).toString()
    : value.toFixed(2);
};
