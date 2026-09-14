import { CallingState } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import { LoadingIndicator, Notification } from '../../../components';

export const ConnectionNotification = () => {
  const { t } = useI18n();
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const isOffline = callingState === CallingState.OFFLINE;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  const showError = isOffline || hasFailedToRecover;
  const showLoading = isJoining || isReconnecting || isMigrating;

  if (showError) {
    return (
      <div className="str-video__embedded-connection-notification">
        <Notification
          isVisible
          placement="bottom"
          message={
            isOffline
              ? t(
                  'connectionNotification.offline.text',
                  'You are offline. Check your internet connection.',
                )
              : t(
                  'connectionNotification.failedToRestore.text',
                  'Failed to restore connection. Please try again.',
                )
          }
        />
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="str-video__embedded-connection-notification">
        <Notification
          isVisible
          placement="bottom"
          iconClassName={null}
          message={
            <LoadingIndicator
              text={
                isMigrating
                  ? t('connectionNotification.migrating.text', 'Migrating...')
                  : isJoining
                    ? t('connectionNotification.joining.text', 'Joining')
                    : t(
                        'connectionNotification.reconnecting.text',
                        'Reconnecting...',
                      )
              }
            />
          }
        />
      </div>
    );
  }

  return null;
};
