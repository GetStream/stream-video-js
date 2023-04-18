import { FC } from 'react';

import styles from './LatencyMapPopup.module.css';

export type Props = {
  abbriviation: string;
  city: string;
  countryCode: string;
};

export const LatencyMapPopup: FC<Props> = ({
  abbriviation,
  city,
  countryCode,
}) => (
  <div className={styles.root}>
    <div className={styles.container}>
      <h3 className={styles.header}>
        <div className={styles.latencyIndicator}></div>
        <span className={styles.abbriviation}>{abbriviation}</span>
      </h3>
      <p className={styles.description}>
        {city}, {countryCode}
      </p>
    </div>
    <div className={styles.indicator}>
      <div className={styles.indicatorInner}></div>
    </div>
  </div>
);
