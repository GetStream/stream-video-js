import { FC } from 'react';
import { ResponsiveLine } from '@nivo/line';
import classnames from 'classnames';

import styles from './CallStatsLatencyChart.module.css';

export type Props = {
  className: string;
  values: Array<{ x: number; y: number }>;
};

export const CallStatsLatencyChart: FC<Props> = ({ className, values }) => {
  const rootClassName = classnames(styles.root, className);

  let max = 0;

  const data = values.map((point) => {
    const { y } = point;
    max = Math.max(max, y);
    return point;
  });

  return (
    <div className={rootClassName}>
      <h2 className={styles.heading}>Call Timeline</h2>
      <ResponsiveLine
        colors={{ scheme: 'blues' }}
        data={[
          {
            id: 'Latency',
            data: data,
          },
        ]}
        animate
        margin={{ top: 10, right: 5, bottom: 5, left: 30 }}
        enablePoints
        enableGridX
        enableGridY
        enableSlices="x"
        isInteractive
        useMesh={true}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 0,
          max: max < 150 ? 150 : max + 30,
          nice: true,
        }}
        axisRight={{
          ticksPosition: 'before',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legendOffset: 0,
        }}
        axisLeft={null}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: '#FCFCFD',
              },
            },
          },
          grid: {
            line: {
              strokeWidth: 0.1,
              fill: '#005FFF',
            },
          },
        }}
      />
    </div>
  );
};
