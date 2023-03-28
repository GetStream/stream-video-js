import { useEffect } from 'react';
import {
  CopyToClipboardButtonWithPopup,
  DeviceSettings,
  IconButton,
  useActiveCall,
} from '@stream-io/video-react-sdk';
import { CallHeaderTitle } from './CallHeaderTitle';
import { CallRecordings } from './CallRecordings';
import { USAGE_GUIDE_LINK } from './index';
import { IconInviteLinkButton } from './InviteLinkButton';

export const ActiveCallHeader = () => {
  const activeCall = useActiveCall();

  useEffect(() => {
    activeCall?.updateRecordingsList();
  }, [activeCall]);

  return (
    <div className="str-video__call-header">
      <CallHeaderTitle />
      <div className="str-video__call-header__controls-group">
        <IconButton
          icon="info-document"
          title="Usage guide and known limitations"
          onClick={() => {
            if (window) {
              window.open(USAGE_GUIDE_LINK, '_blank', 'noopener,noreferrer');
            }
          }}
        />
        <CopyToClipboardButtonWithPopup
          Button={IconInviteLinkButton}
          copyValue={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <CallRecordings />
        <DeviceSettings />
      </div>
    </div>
  );
};
