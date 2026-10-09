import { Icon } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

type NativeApp = 'android' | 'ios' | 'reactNative' | 'flutter';

/**
 * The store-link labels used to live on the link objects and reach `t()` as a runtime value. A
 * `switch` over the closed set of apps puts each key back next to its English.
 */
const nativeAppLabel = (t: LooseTranslateFunction, app: NativeApp) => {
  switch (app) {
    case 'android':
      return t('mobileBanner.tryAndroid.label', 'Try Android');
    case 'ios':
      return t('mobileBanner.tryIos.label', 'Try iOS');
    case 'reactNative':
      return t('mobileBanner.tryReactNative.label', 'Try React Native');
    case 'flutter':
      return t('mobileBanner.tryFlutter.label', 'Flutter');
  }
};

export const MobileAppBanner = (props: {
  callId: string;
  platform: 'ios' | 'android';
  onDismiss?: () => void;
}) => {
  const { callId, platform, onDismiss } = props;
  const { t } = useAppI18n();
  const platformLinks: Record<
    'android' | 'ios',
    { app: NativeApp; url: string; active: boolean }[]
  > = {
    android: [
      {
        app: 'android',
        url: `https://play.google.com/store/apps/details?id=io.getstream.video.android&referrer=${encodeURIComponent(
          `call_id=${callId}`,
        )}`,
        active: true,
      },
      {
        app: 'reactNative',
        url: `https://play.google.com/store/apps/details?id=io.getstream.rnvideosample&referrer=${encodeURIComponent(
          `call_id=${callId}`,
        )}`,
        active: true,
      },
      { app: 'flutter', url: '#', active: false },
    ],
    ios: [
      {
        app: 'ios',
        url: 'https://apps.apple.com/us/app/stream-video-calls/id1644313060',
        active: true,
      },
      {
        app: 'reactNative',
        url: 'https://apps.apple.com/us/app/stream-video-calls-rn/id6443437501',
        active: true,
      },
      // { app: 'flutter', url: '#', active: false },
    ],
  };

  return (
    <div className="rd__try-native">
      <img
        className="rd__try-native__logo"
        alt="logo"
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/home.png`}
      />
      <h2 className="rd__try-native__title">
        {t('mobileBanner.tryNativeDemo.title', 'Try Native Demo!')}
      </h2>
      <p className="rd__try-native__info-text">
        {t(
          'mobileBanner.tryNativeDemo.description',
          'We see you are using a mobile device. Why don’t you give it a try on one of our native mobile apps:',
        )}
      </p>
      {(platformLinks[platform] || [])
        .filter((app) => app.active)
        .map((link) => (
          <a
            key={link.app}
            className="rd__button rd__button--primary"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            <Icon className="rd__button__icon" icon="login" />
            {nativeAppLabel(t, link.app)}
          </a>
        ))}
      <button
        className="rd__try-native__use-browser rd__button rd__button--secondary"
        onClick={onDismiss}
      >
        {t('mobileBanner.continueWithBrowser.label', 'Continue With Browser')}
      </button>
    </div>
  );
};
