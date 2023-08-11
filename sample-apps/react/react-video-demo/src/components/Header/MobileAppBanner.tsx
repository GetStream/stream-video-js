import styles from './MobileAppBanner.module.css';
import classNames from 'classnames';
import { useState } from 'react';
import { useCall } from '@stream-io/video-react-sdk';

export const MobileAppBanner = (props: {
  platform: 'android' | 'ios';
  className?: string;
  onDismiss?: () => void;
}) => {
  const call = useCall();
  const [isVisible, setIsVisible] = useState(true);
  if (!isVisible) return null;

  const platformLinks: Record<
    'android' | 'ios',
    { label: string; url: string; active: boolean }[]
  > = {
    android: [
      {
        label: 'Android',
        url: `https://play.google.com/store/apps/details?id=io.getstream.video.android&referrer=${encodeURIComponent(
          `call_id=${call?.id}`,
        )}`,
        active: true,
      },
      { label: 'React Native', url: '#', active: false },
      { label: 'Flutter', url: '#', active: false },
    ],
    ios: [
      {
        label: 'iOS',
        url: 'https://apps.apple.com/us/app/stream-video-calls/id1644313060',
        active: true,
      },
      { label: 'React Native', url: '#', active: false },
      { label: 'Flutter', url: '#', active: false },
    ],
  };

  return (
    <div className={classNames(styles.mobileBanner, props.className)}>
      <h2 className={styles.tryNativeHeading}>Try Native!</h2>
      <p className={styles.infoText}>
        We see you are using a mobile device.
        <br />
        Why don't you give it a try to one of our native mobile apps:
      </p>
      <div className="flex flex-wrap flex-col xs:flex-row justify-center gap-2 w-full">
        {(platformLinks[props.platform] || [])
          .filter((app) => app.active)
          .map((link) => (
            <a
              key={link.label}
              className={classNames(styles.nativeAppLink, 'flex-1')}
              href={link.url}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
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
