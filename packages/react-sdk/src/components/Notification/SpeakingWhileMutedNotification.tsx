import { PropsWithChildren } from 'react';
import { Placement } from '@floating-ui/react';

import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import { Notification } from './Notification';

export type SpeakingWhileMutedNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;
  placement?: Placement;
};

export const SpeakingWhileMutedNotification = ({
  children,
  text,
  placement,
}: PropsWithChildren<SpeakingWhileMutedNotificationProps>) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const { t } = useI18n();

  const message =
    text ??
    t(
      'notification.speakingWhileMuted.text',
      'You are muted. Unmute to speak.',
    );
  return (
    <Notification
      message={message}
      isVisible={isSpeakingWhileMuted}
      placement={placement || 'top-start'}
    >
      {children}
    </Notification>
  );
};
