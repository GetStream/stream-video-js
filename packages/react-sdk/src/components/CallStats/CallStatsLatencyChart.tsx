import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  LinearScale,
  LineElement,
  PointElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';

// NOTE: this is a side effect by definition, but this component is
// isolated in a separate chunk, and it won't affect the rest of the app.
// See CallStats.tsx for more details.
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement);

const CallStatsLatencyChart = (props: {
  values: Array<{ x: number; y: number }>;
}) => {
  const { values } = props;

  const max = useMemo(() => {
    if (values.length === 0) return 0;
    return Math.max(...values.map((v) => v.y));
  }, [values]);

  const data: ChartData<'line'> = {
    labels: values.map((point) => {
      const date = new Date(point.x * 1000);
      return `${date.getHours()}:${date.getMinutes()}`;
    }),
    datasets: [
      {
        data: values,
        borderColor: '#00e2a1',
        backgroundColor: '#00e2a1',
      },
    ],
  };

  const options = useMemo(() => getLineOptions(max), [max]);
  return (
    <div className="str-video__call-stats-line-chart-container">
      <Line
        options={options}
        data={data}
        className="str-video__call-stats__latencychart"
      />
    </div>
  );
};

export default CallStatsLatencyChart;

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
