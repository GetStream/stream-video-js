import { FC, ReactNode, useState } from 'react';
import classnames from 'classnames';
import { isAndroid, isIOS, isSafari } from 'mobile-device-detect';
import { FeatureCollection, Geometry } from 'geojson';

import MobileAppBanner from '../../MobileAppBanner';
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
  const shouldRenderMobileAppBanner = isAndroid || (isIOS && !isSafari);
  const [isNativeAppsBannerDismissed, setIsNativeAppsBannerDismissed] =
    useState(!shouldRenderMobileAppBanner);
  const rootClassName = classnames(
    styles.root,
    className,
    !isNativeAppsBannerDismissed && 'overflow-y-scroll',
  );
  return (
    <section className={rootClassName}>
      <LatencyMap className={styles.latencyMap} sourceData={edges} />
      {shouldRenderMobileAppBanner && (
        <MobileAppBanner
          platform={isAndroid ? 'android' : 'ios'}
          className={styles.mobileBanner}
          onDismiss={() => {
            setIsNativeAppsBannerDismissed(true);
          }}
        />
      )}
      <section
        className={classnames(
          styles.layoutContainer,
          !isNativeAppsBannerDismissed && styles.mobileBannerVisible,
        )}
      >
        <div className={styles.header}>{header}</div>
        <div
          className={classnames(styles.body, {
            'items-center': isNativeAppsBannerDismissed,
          })}
        >
          {children}
        </div>
      </section>
    </section>
  );
};
