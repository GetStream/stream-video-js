import { ResponsiveLine } from '@nivo/line';

export const CallStatsLatencyChart = (props: {
  values: Array<{ x: number; y: number }>;
}) => {
  const { values } = props;
  let max = 0;
  const data = values.map((point) => {
    const { y } = point;
    max = Math.max(max, y);
    return point;
  });
  return (
    <div className="str-video__call-stats-line-chart-container">
      <ResponsiveLine
        colors={{ scheme: 'blues' }}
        data={[
          {
            id: 'Latency',
            data: data,
          },
        ]}
        animate={false}
        margin={{ top: 10, right: 5, bottom: 5, left: 30 }}
        enablePoints
        enableGridX={false}
        enableGridY
        enableSlices="x"
        isInteractive
        useMesh={false}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 0,
          max: max < 220 ? 220 : max + 30,
          nice: true,
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: '#FCFCFD',
              },
              line: {
                stroke: '#FCFCFD',
              },
            },
          },
          grid: {
            line: {
              strokeWidth: 0.1,
            },
          },
        }}
      />
    </div>
  );
};
