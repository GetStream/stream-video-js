import styles from './MobileAppBanner.module.css';
import classNames from 'classnames';
import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

export const MobileAppBanner = (props: {
  className?: string;
  onDismiss?: () => void;
}) => {
  const call = useCall();
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;
  return (
    <div className={classNames(styles.mobileBanner, props.className)}>
      <h2 className={styles.tryNativeHeading}>Try Native!</h2>
      <p className={styles.infoText}>
        We see you are using a mobile device.
        <br />
        Why don't you give it a try to one of our native mobile apps:
      </p>
      <div className="flex flex-wrap flex-col xs:flex-row justify-center gap-2 w-full">
        <a
          className={styles.nativeAppLink + ' flex-1'}
          href={`https://play.google.com/store/apps/details?id=io.getstream.video.android.app&referrer=${call?.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Android
        </a>
        <a
          className={styles.nativeAppLink + ' flex-1 hidden'}
          href="#"
          target="_blank"
        >
          React Native
        </a>
        <a
          className={styles.nativeAppLink + ' flex-1 hidden'}
          href="#"
          target="_blank"
        >
          Flutter
        </a>
      </div>
      <p className={styles.infoText}>
        Of course, you can always continue in your browser
      </p>
      <a
        className={classNames(styles.nativeAppLink, styles.dismissButton)}
        href="#"
        target="_blank"
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(false);
          props.onDismiss?.();
        }}
      >
        Dismiss
      </a>
    </div>
  );
};
