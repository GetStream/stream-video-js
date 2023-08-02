import { FC, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { isAndroid } from 'mobile-device-detect';
import { FeatureCollection, Geometry } from 'geojson';

import LatencyMap from '../../LatencyMap';

import styles from './LobbyLayout.module.css';
import { MobileAppBanner } from '../../Header/MobileAppBanner';
import { useUserContext } from '../../../contexts/UserContext';

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
  const { qr } = useUserContext();
  const shouldRenderMobileAppBanner = isAndroid && qr;
  const [shouldCenterBody, setShouldCenterBody] = useState(
    !shouldRenderMobileAppBanner,
  );
  const rootClassName = classnames(styles.root, className);
  return (
    <section className={rootClassName}>
      <LatencyMap className={styles.latencyMap} sourceData={edges} />
      {shouldRenderMobileAppBanner && (
        <MobileAppBanner
          className={styles.mobileBanner}
          onDismiss={() => {
            setShouldCenterBody(true);
          }}
        />
      )}
      <section className={styles.layoutContainer}>
        <div className={styles.header}>{header}</div>
        <div
          className={classnames(styles.body, {
            'items-center': shouldCenterBody,
          })}
        >
          {children}
        </div>
      </section>
    </section>
  );
};
