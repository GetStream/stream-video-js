import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  maintainAspectRatio: false,
  scales: {
    y: {
      position: 'right',
      stacked: true,
      min: 0,
      max: 100,
      grid: {
        display: true,
        color: '#979ca0',
      },
    },
    x: {
      grid: {
        display: false,
      },
      ticks: {
        display: false,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
};

export const CallStatsLatencyChart = (props: {
  values: Array<{ x: number; y: number }>;
}) => {
  const { values } = props;
  let max = 0;

  const data = {
    labels: values.map((point) => {
      const date = new Date(point.x * 1000);
      return `${date.getHours()}:${date.getMinutes()}`;
    }),
    datasets: [
      {
        label: 'Latency',
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
