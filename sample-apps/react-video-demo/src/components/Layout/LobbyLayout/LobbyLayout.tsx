import { FC, ReactNode } from 'react';
import classnames from 'classnames';

import LatencyMap from '../../LatencyMap';

import { serverMarkerFeatures } from '../../../../data/servers';

import styles from './LobbyLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children: ReactNode;
};

export const LobbyLayout: FC<Props> = ({ className, header, children }) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <section className={rootClassName}>
      <LatencyMap
        className={styles.latencyMap}
        sourceData={serverMarkerFeatures}
      />
      <section className={styles.layoutContainer}>
        <div className={styles.header}>{header}</div>
        <div className={styles.body}>{children}</div>
      </section>
    </section>
  );
};
