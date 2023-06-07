import { FC, ReactNode } from 'react';
import classnames from 'classnames';
import { FeatureCollection, Geometry } from 'geojson';

import LatencyMap from '../../LatencyMap';

import styles from './LobbyLayout.module.css';

export type Props = {
  className?: string;
  header: ReactNode;
  children: ReactNode;
  edges?: FeatureCollection<Geometry>;
};

export const LobbyLayout: FC<Props> = ({
  className,
  header,
  children,
  edges,
}) => {
  const rootClassName = classnames(styles.root, className);
  return (
    <section className={rootClassName}>
      <LatencyMap className={styles.latencyMap} sourceData={edges} />
      <section className={styles.layoutContainer}>
        <div className={styles.header}>{header}</div>
        <div className={styles.body}>{children}</div>
      </section>
    </section>
  );
};
