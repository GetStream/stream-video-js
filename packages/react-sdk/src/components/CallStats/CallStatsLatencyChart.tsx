import { lazy, Suspense, useMemo } from 'react';
import type { ChartData, ChartOptions } from 'chart.js';

const Line = lazy(() =>
  import('chart.js')
    .then(({ CategoryScale, Chart, LinearScale, LineElement, PointElement }) =>
      Chart.register(CategoryScale, LinearScale, LineElement, PointElement),
    )
    .then(() =>
      import('react-chartjs-2').then((module) => ({ default: module.Line })),
    ),
);

export const CallStatsLatencyChart = (props: {
  values: Array<{ x: number; y: number }>;
}) => {
  const { values } = props;
  let max = 0;
  const data: ChartData<'line'> = {
    labels: values.map((point) => {
      const date = new Date(point.x * 1000);
      return `${date.getHours()}:${date.getMinutes()}`;
    }),
    datasets: [
      {
        data: values.map((point) => {
          const { y } = point;
          max = Math.max(max, y);
          return point;
        }),
        borderColor: '#00e2a1',
        backgroundColor: '#00e2a1',
      },
    ],
  };

  const options = useMemo(() => getLineOptions(max), [max]);
  return (
    <div className="str-video__call-stats-line-chart-container">
      <Suspense fallback={null}>
        <Line
          options={options}
          data={data}
          className="str-video__call-stats__latencychart"
        />
      </Suspense>
    </div>
  );
};

const getLineOptions = (max: number): ChartOptions<'line'> => ({
  maintainAspectRatio: false,
  animation: { duration: 0 },
  elements: {
    line: { borderWidth: 1 },
    point: { radius: 2 },
  },
  scales: {
    y: {
      position: 'right',
      stacked: true,
      min: 0,
      max: Math.max(180, Math.ceil((max + 10) / 10) * 10),
      grid: { display: true, color: '#979ca0' },
      ticks: { stepSize: 30 },
    },
    x: {
      grid: { display: false },
      ticks: { display: false },
    },
  },
});
