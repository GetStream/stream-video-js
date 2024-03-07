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

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement);

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

  const options = useMemo<ChartOptions<'line'>>(() => {
    return {
      maintainAspectRatio: false,
      animation: {
        duration: 0,
      },
      elements: {
        line: {
          borderWidth: 1,
        },
        point: {
          radius: 2,
        },
      },
      scales: {
        y: {
          position: 'right',
          stacked: true,
          min: 0,
          max: Math.max(180, Math.ceil((max + 10) / 10) * 10),
          grid: {
            display: true,
            color: '#979ca0',
          },
          ticks: {
            stepSize: 30,
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
    };
  }, [max]);

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
