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

import { ParticipantDiagnostics } from './rtcStats';

ChartJS.register(LinearScale, LineElement, PointElement, Tooltip, Legend);

export type DiagnosticsMetric = 'bitrate' | 'latency' | 'packet-loss' | 'fps';

type MetricSeries = {
  label: string;
  color: string;
  value: (sample: ParticipantDiagnostics) => number | undefined;
};

const metricConfig: Record<
  DiagnosticsMetric,
  { title: string; unit: string; series: MetricSeries[] }
> = {
  bitrate: {
    title: 'Bitrate',
    unit: 'Mbps',
    series: [
      {
        label: 'Publish',
        color: '#00e2a1',
        value: ({ publishBitrate }) =>
          publishBitrate === undefined ? undefined : publishBitrate / 1_000_000,
      },
      {
        label: 'Receive',
        color: '#38bdf8',
        value: ({ receiveBitrate }) =>
          receiveBitrate === undefined ? undefined : receiveBitrate / 1_000_000,
      },
    ],
  },
  latency: {
    title: 'Latency and jitter',
    unit: 'ms',
    series: [
      {
        label: 'RTT',
        color: '#f97316',
        value: ({ roundTripTimeMs }) => roundTripTimeMs,
      },
      {
        label: 'Publish jitter',
        color: '#a78bfa',
        value: ({ publishJitterMs }) => publishJitterMs,
      },
      {
        label: 'Receive jitter',
        color: '#f472b6',
        value: ({ receiveJitterMs }) => receiveJitterMs,
      },
    ],
  },
  'packet-loss': {
    title: 'Packet loss',
    unit: '%',
    series: [
      {
        label: 'Publish',
        color: '#f59e0b',
        value: ({ publishPacketLossPercent }) => publishPacketLossPercent,
      },
      {
        label: 'Receive',
        color: '#ef4444',
        value: ({ receivePacketLossPercent }) => receivePacketLossPercent,
      },
    ],
  },
  fps: {
    title: 'Video frame rate',
    unit: 'fps',
    series: [
      {
        label: 'Publish',
        color: '#22c55e',
        value: ({ publishFps }) => publishFps,
      },
      {
        label: 'Receive',
        color: '#06b6d4',
        value: ({ receiveFps }) => receiveFps,
      },
    ],
  },
};

export const LiveMetricsChart = ({
  metric,
  samples,
}: {
  metric: DiagnosticsMetric;
  samples: ParticipantDiagnostics[];
}) => {
  const config = metricConfig[metric];
  const data = useMemo<ChartData<'line'>>(
    () => ({
      datasets: config.series.map((series) => ({
        label: series.label,
        data: samples.flatMap((sample) => {
          const value = series.value(sample);
          return value === undefined ? [] : [{ x: sample.updatedAt, y: value }];
        }),
        borderColor: series.color,
        backgroundColor: series.color,
        pointRadius: samples.length > 60 ? 0 : 2,
        pointHoverRadius: 4,
        borderWidth: 2,
        tension: 0.2,
      })),
    }),
    [config, samples],
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
              `${item.dataset.label}: ${formatValue(item.parsed.y)} ${config.unit}`,
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
          title: { display: true, text: config.unit },
          ticks: { callback: (value) => formatValue(Number(value)) },
        },
      },
    }),
    [config.unit],
  );

  return (
    <section className="rd__call-diagnostics__chart">
      <h3>{config.title}</h3>
      <div className="rd__call-diagnostics__chart-canvas">
        <Line
          aria-label={`${config.title} over time`}
          data={data}
          options={options}
          role="img"
        />
      </div>
    </section>
  );
};

export default LiveMetricsChart;

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
