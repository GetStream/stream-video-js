import { useEffect } from 'react';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  CallingState,
  CopyToClipboardButtonWithPopup,
  DeviceSettings,
  IconButton,
  LoadingIndicator,
  Notification,
  useCall,
  useCallCallingState,
} from '@stream-io/video-react-sdk';
import { CallHeaderTitle } from './CallHeaderTitle';
import { CallRecordings } from './CallRecordings';
import { USAGE_GUIDE_LINK } from './index';
import { IconInviteLinkButton } from './InviteLinkButton';
import { LayoutSelector, LayoutSelectorProps } from './LayoutSelector';
import { useSettings } from '../context/SettingsContext';
import { SwapSfuButton } from './SwapSfuButton';

export const ActiveCallHeader = ({
  selectedLayout,
  onMenuItemClick: setLayout,
}: LayoutSelectorProps) => {
  const { setOpen } = useSettings();
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const isOffline = callingState === CallingState.OFFLINE;
  const isMigrating = callingState === CallingState.MIGRATING;
  const hasFailedToRecover = callingState === CallingState.RECONNECTING_FAILED;
  const isRecoveringConnection = [
    CallingState.JOINING,
    CallingState.RECONNECTING,
  ].includes(callingState);

  useEffect(() => {
    activeCall?.queryRecordings().catch((e) => {
      console.error('Failed to query recordings', e);
    });
  }, [activeCall]);

  return (
    <>
      <div className="str-video__call-header">
        <CallHeaderTitle />
        <div className="str-video__call-header__controls-group">
          <SwapSfuButton />
          <LayoutSelector
            selectedLayout={selectedLayout}
            onMenuItemClick={setLayout}
          />
          <IconButton
            icon="info-document"
            title="Usage guide and known limitations"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(USAGE_GUIDE_LINK, '_blank', 'noopener,noreferrer');
              }
            }}
          />
          <CopyToClipboardButtonWithPopup
            Button={IconInviteLinkButton}
            copyValue={
              typeof window !== 'undefined' ? window.location.href : ''
            }
            popupPlacement="bottom"
          />
          <CallRecordings />
          <DeviceSettings />
          <button
            style={{
              padding: 0,
              background: '#1c1e22',
              color: 'white',
              borderRadius: '8px',
            }}
            onClick={() => setOpen(true)}
          >
            <MoreVertIcon fill="white" />
          </button>
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
              isVisible={isRecoveringConnection || isMigrating}
              iconClassName={null}
              placement="bottom"
              message={
                <LoadingIndicator
                  text={isMigrating ? 'Migrating...' : 'Reconnecting...'}
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
