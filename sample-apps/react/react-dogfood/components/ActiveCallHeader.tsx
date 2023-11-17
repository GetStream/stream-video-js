import {
  CallingState,
  CancelCallButton,
  LoadingIndicator,
  Notification,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { CallHeaderTitle } from './CallHeaderTitle';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';

import { LayoutSelectorProps } from './LayoutSelector';

export const ActiveCallHeader = ({
  selectedLayout,
  onMenuItemClick: setLayout,
  onLeave,
}: { onLeave: () => void } & LayoutSelectorProps) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const isJoining = callingState === CallingState.JOINING;
  const isReconnecting = callingState === CallingState.RECONNECTING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;

  return (
    <>
      <div className="str-video__call-header">
        <CallHeaderTitle />
        <div className="str-video__call-header__controls-group">
          <CancelCallButton onLeave={onLeave} />

          <ToggleSettingsTabModal
            selectedLayout={selectedLayout}
            onMenuItemClick={setLayout}
            close={() => {
              console.log('Closing Settings Modal');
            }}
          />
        </div>
      </div>
      <div className="str-video__call-header__notifications">
        {(() => {
          if (isOffline || hasFailedToRecover) {
            return (
              <Notification
                isVisible
                placement="bottom"
                message={
                  isOffline
                    ? 'You are offline. Check your internet connection and try again later.'
                    : 'Failed to restore connection. Check your internet connection and try again later.'
                }
              >
                <span />
              </Notification>
            );
          }

          return (
            <Notification
              isVisible={isJoining || isReconnecting || isMigrating}
              iconClassName={null}
              placement="bottom"
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
          );
        })()}
      </div>
    </>
  );
};
