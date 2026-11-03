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
  getPlaybackAudioForPublisher,
  ParticipantDiagnostics,
} from './rtcStats';
import AudioEventTimeline from './AudioEventTimeline';
import { OwnedAudioDiagnosticEvent } from './audioEventClusters';

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend);

export type AudioReceiverChartPublisher = {
  label: string;
  userId: string;
  userSessionId: string;
};

export type AudioReceiverChartProps = {
  receiverLabel: string;
  samples: ParticipantDiagnostics[];
  publishers: AudioReceiverChartPublisher[];
};

const colors = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#f59e0b',
  '#22c55e',
  '#06b6d4',
];

export const AudioReceiverChart = ({
  receiverLabel,
  samples,
  publishers,
}: AudioReceiverChartProps) => {
  const data = useMemo<ChartData<'line'>>(
    () => ({
      datasets: publishers.flatMap((publisher, index) => {
        const color = colors[index % colors.length];
        return [
          {
            label: `${publisher.label} decoded`,
            data: samples.flatMap((sample) => {
              const audio = getInboundAudioForPublisher(
                sample,
                publisher.userId,
                publisher.userSessionId,
              );
              return audio?.audioLevel === undefined
                ? []
                : [{ x: sample.updatedAt, y: audio.audioLevel * 100 }];
            }),
            borderColor: color,
            backgroundColor: color,
            borderDash: [5, 4],
            pointRadius: samples.length > 60 ? 0 : 2,
            borderWidth: 1,
            tension: 0.2,
          },
          {
            label: `${publisher.label} playback`,
            data: samples.flatMap((sample) => {
              const audio = getPlaybackAudioForPublisher(
                sample,
                publisher.userId,
                publisher.userSessionId,
              );
              return audio?.averageLevel === undefined
                ? []
                : [{ x: sample.updatedAt, y: audio.averageLevel * 100 }];
            }),
            borderColor: color,
            backgroundColor: color,
            pointRadius: samples.length > 60 ? 0 : 2,
            borderWidth: 3,
            tension: 0.2,
          },
        ];
      }),
    }),
    [publishers, samples],
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
              `${item.dataset.label}: ${formatValue(item.parsed.y)}%`,
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
          suggestedMax: 25,
          title: { display: true, text: 'Audio signal level' },
          ticks: { callback: (value) => `${formatValue(Number(value))}%` },
        },
      },
    }),
    [],
  );
  const events = useMemo(() => collectEvents(samples), [samples]);
  const timestamps = [
    ...samples.map(({ updatedAt }) => updatedAt),
    ...events.map(({ event }) => event.timestamp),
  ];
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);

  return (
    <section className="rd__call-diagnostics__fanout-chart">
      <div className="rd__call-diagnostics__fanout-chart-title">
        <h3>Decoded signal vs browser playback signal</h3>
        <p>
          Dashed lines come from WebRTC receive stats. Solid lines come from the
          receiver’s WebAudio playback graph.
        </p>
      </div>
      <AudioEventTimeline
        ariaLabel={`Audio endpoint and playback events for ${receiverLabel}`}
        entries={events}
        maxTimestamp={maxTimestamp}
        minTimestamp={minTimestamp}
      />
      <div className="rd__call-diagnostics__fanout-chart-canvas">
        <Line
          aria-label={`Decoded and browser playback audio for ${receiverLabel} over time`}
          data={data}
          options={options}
          role="img"
        />
      </div>
    </section>
  );
};

export default AudioReceiverChart;

const collectEvents = (samples: ParticipantDiagnostics[]) => {
  const unique = new Map<string, OwnedAudioDiagnosticEvent>();
  samples
    .flatMap(({ audioEvents }) => audioEvents)
    .filter(({ type }) =>
      [
        'audio-context',
        'bluetooth-profile',
        'capture-lifecycle',
        'input-device',
        'output-device',
        'playback',
      ].includes(type),
    )
    .forEach((event) => unique.set(event.id, { event }));
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
