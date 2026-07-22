import { Icon, useI18n } from '@stream-io/video-react-sdk';

export const MobileAppBanner = (props: {
  callId: string;
  platform: 'ios' | 'android';
  onDismiss?: () => void;
}) => {
  const { callId, platform, onDismiss } = props;
  const { t } = useI18n();
  const platformLinks: Record<
    'android' | 'ios',
    { label: string; url: string; active: boolean }[]
  > = {
    android: [
      {
        label: 'Try Android',
        url: `https://play.google.com/store/apps/details?id=io.getstream.video.android&referrer=${encodeURIComponent(
          `call_id=${callId}`,
        )}`,
        active: true,
      },
      {
        label: 'Try React Native',
        url: `https://play.google.com/store/apps/details?id=io.getstream.rnvideosample&referrer=${encodeURIComponent(
          `call_id=${callId}`,
        )}`,
        active: true,
      },
      { label: 'Flutter', url: '#', active: false },
    ],
    ios: [
      {
        label: 'Try iOS',
        url: 'https://apps.apple.com/us/app/stream-video-calls/id1644313060',
        active: true,
      },
      {
        label: 'Try React Native',
        url: 'https://apps.apple.com/us/app/stream-video-calls-rn/id6443437501',
        active: true,
      },
      // { label: 'Flutter', url: '#', active: false },
    ],
  };

  return (
    <div className="rd__try-native">
      <img
        className="rd__try-native__logo"
        alt="logo"
        src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/home.png`}
      />
      <h2 className="rd__try-native__title">{t('Try Native Demo!')}</h2>
      <p className="rd__try-native__info-text">
        {t(
          'We see you are using a mobile device. Why don’t you give it a try on one of our native mobile apps:',
        )}
      </p>
      {(platformLinks[platform] || [])
        .filter((app) => app.active)
        .map((link) => (
          <a
            key={link.label}
            className="rd__button rd__button--primary"
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            <Icon className="rd__button__icon" icon="login" />
            {t(link.label)}
          </a>
        ))}
      <button
        className="rd__try-native__use-browser rd__button rd__button--secondary"
        onClick={onDismiss}
      >
        {t('Continue With Browser')}
      </button>
    </div>
  );
};
