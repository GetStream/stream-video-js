import {
  CallingState,
  LoadingIndicator,
  Notification,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const ConnectionNotification = () => {
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
      <div className="rd__connection-notification">
        <Notification
          isVisible
          placement="top"
          message={
            isOffline
              ? 'You are offline. Check your internet connection.'
              : 'Failed to restore connection. Please try again.'
          }
        >
          <span />
        </Notification>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="rd__connection-notification">
        <Notification
          isVisible
          placement="top"
          iconClassName={null}
          message={
            <LoadingIndicator
              text={
                isMigrating
                  ? 'Migrating...'
                  : isJoining
                    ? 'Joining...'
                    : 'Reconnecting...'
              }
            />
          }
        >
          <span />
        </Notification>
      </div>
    );
  }

  return null;
};
