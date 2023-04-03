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
        data={[
          {
            id: 'latency',
            color: '#005FFF',
            data: data,
          },
        ]}
        enablePoints
        enableGridX={false}
        enableGridY
        enableSlices="x"
        isInteractive
        enableCrosshair={false}
        useMesh={false}
        tooltip={({ point }) => {
          return (
            <div>
              lalalala
              <h6>{point.data.yFormatted}</h6>
            </div>
          );
        }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 0,
          max: max < 150 ? 150 : max + 30,
          nice: true,
        }}
        margin={{ top: 10, right: 5, bottom: 5, left: 30 }}
        axisTop={null}
        axisBottom={null}
        axisRight={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: '',
          legendOffset: 0,
        }}
        pointSize={4}
        pointColor="#005FFF"
        colors={['#005FFF']}
        lineWidth={4}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(255, 255, 255, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
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
              stroke: '#B4B7BB',
            },
          },
        }}
      />
    </div>
  );
};
