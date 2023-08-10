import { FC, useEffect, useRef, useState } from 'react';
import {
  CallStatsReport,
  useCallStatsReport,
} from '@stream-io/video-react-sdk';
import classnames from 'classnames';

import StatCard from '../StatCard';
import { BarGraph, Close, Cog, Info, Latency } from '../Icons';
import Button from '../Button';
import Tooltip from '../Tooltip';
import CallStatsLatencyChart from '../CallStatsLatencyChart';

import { useModalContext } from '../../contexts/ModalContext';

import { toFrameSize } from '../../utils/useToFrameSize';
import {
  calculatePublishBitrate,
  calculateSubscribeBitrate,
} from '../../utils/useCalculateBitRate';

import styles from './CallStats.module.css';

export type Props = {
  className?: string;
  callId?: string;
};

export const CallStats: FC<Props> = ({ className, callId }) => {
  const [latencyBuffer, setLatencyBuffer] = useState<
    Array<{ x: number; y: number }>
  >(() => {
    const now = Date.now();
    return Array(20)
      .fill(null)
      .map((_, i) => ({ x: now + i, y: 0 }));
  });
  const [publishBitrate, setPublishBitrate] = useState('-');
  const [subscribeBitrate, setSubscribeBitrate] = useState('-');
  const previousStats = useRef<CallStatsReport>();
  const callStatsReport = useCallStatsReport();

  const { closeModal } = useModalContext();

  useEffect(() => {
    if (!callStatsReport) return;
    if (!previousStats.current) {
      previousStats.current = callStatsReport;
      return;
    }
    const previousCallStatsReport = previousStats.current;
    setPublishBitrate(() => {
      return calculatePublishBitrate(previousCallStatsReport, callStatsReport);
    });
    setSubscribeBitrate(() => {
      return calculateSubscribeBitrate(
        previousCallStatsReport,
        callStatsReport,
      );
    });

    setLatencyBuffer((latencyBuf) => {
      const newLatencyBuffer = latencyBuf.slice(-19);
      newLatencyBuffer.push({
        x: callStatsReport.timestamp,
        y: callStatsReport.publisherStats.averageRoundTripTimeInMs,
      });
      return newLatencyBuffer;
    });

    previousStats.current = callStatsReport;
  }, [callStatsReport]);

  const rootClassName = classnames(styles.root, className);
  return (
    <div className={rootClassName}>
      <div className={styles.heading}>
        <h2 className={styles.header}>
          <Cog className={styles.cog} />
          Settings
        </h2>
        <p className={styles.callId}>Call ID: {callId}</p>
        <div className={styles.close}>
          <Button
            onClick={closeModal}
            className={styles.button}
            color="transparent"
            shape="square"
          >
            <Close className={styles.closeIcon} />
          </Button>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={styles.statistics}>
            <div>
              <Info className={styles.sidebarInfo} />
            </div>
            Statistics
          </div>
        </div>
        <div className={styles.content}>
          {callStatsReport && (
            <div className={styles.stats}>
              <div className={styles.callIdContainer}>
                <p className={styles.id}>
                  Call ID:
                  <br />
                  {callId}
                </p>
              </div>
              <h2 className={styles.statsHeader}>Statistics</h2>
              <div className={styles.containerHeader}>
                <Latency className={styles.latency} />
                <h3 className={styles.containerHeading}>Call Latency</h3>
                <div id="latency-tooltip">
                  <Info className={styles.info} />
                </div>
                <Tooltip
                  selector="#latency-tooltip"
                  description="Latency is the delay before a transfer of data begins following an instruction for its transfer."
                />
              </div>
              <p className={styles.description}>
                Very high latency values may reduce call quality, cause lag, and
                make the call less enjoyable.
              </p>

              <div className={styles.chartContainer}>
                <CallStatsLatencyChart
                  className={styles.chart}
                  values={latencyBuffer}
                />
              </div>

              <div className={styles.containerHeader}>
                <BarGraph className={styles.bargraph} />
                <h3 className={styles.containerHeading}>Call performance</h3>
                <div id="statistics-tooltip">
                  <Info className={styles.info} />
                </div>
                <Tooltip
                  selector="#statistics-tooltip"
                  description="These are the details of your call performance."
                />
              </div>
              <p className={styles.description}>
                Your call is recieving data and the connection speed is healthy.
              </p>
              <div className={styles.statCards}>
                <StatCard
                  label="Region"
                  value={callStatsReport.datacenter}
                  description="Region
You connect to Stream’s global edge network based on your local position at the time of the call."
                />
                <StatCard
                  className={styles.statCard}
                  label="Latency"
                  condition={
                    callStatsReport.publisherStats.averageRoundTripTimeInMs <
                    100
                  }
                  value={`${callStatsReport.publisherStats.averageRoundTripTimeInMs} ms.`}
                  description="Latency is the delay before a transfer of data begins following an instruction for its transfer."
                />
                <StatCard
                  className={styles.statCard}
                  label="Receive jitter"
                  description="Jitter
                  The variation in the delay of packets transmitted continuously over a network should be less than 30ms."
                  value={`${callStatsReport.subscriberStats.averageJitterInMs} ms.`}
                />
                <StatCard
                  className={styles.statCard}
                  label="Publish jitter"
                  description="Jitter
                  The variation in the delay of packets transmitted continuously over a network should be less than 30ms."
                  value={`${callStatsReport.publisherStats.averageJitterInMs} ms.`}
                />
                <StatCard
                  className={styles.statCard}
                  label="Publish resolution"
                  value={toFrameSize(callStatsReport.publisherStats)}
                />
                <StatCard
                  className={styles.statCard}
                  label="Publish quality drop reason"
                  description="Packet Loss on average, transmit data packets do not arrive at their destination 1-2.5% of the time."
                  value={
                    callStatsReport.publisherStats.qualityLimitationReasons
                  }
                />
                <StatCard
                  className={styles.statCard}
                  label="Receiving resolution"
                  value={toFrameSize(callStatsReport.subscriberStats)}
                />
                <StatCard
                  className={styles.statCard}
                  label="Receive quality drop reason"
                  description="Packet Loss on average, transmit data packets do not arrive at their destination 1-2.5% of the time."
                  value={
                    callStatsReport.subscriberStats.qualityLimitationReasons
                  }
                />
                <StatCard
                  label="Publish bitrate"
                  value={publishBitrate}
                  description="A higher publish bitrate uses more bandwidth to improve quality. Lower the bitrate to reduce bandwidth and buffering."
                />
                <StatCard
                  label="Receiving bitrate"
                  value={subscribeBitrate}
                  description="A higher subscribe bitrate improves quality with more bandwidth, and a lower bitrate reduces bandwidth usage and buffering."
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={styles.closebar}></div>
    </div>
  );
};
