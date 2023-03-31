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
import { LayoutSelector, LayoutSelectorProps } from './LayoutSelector';

export const ActiveCallHeader = ({
  selectedLayout,
  onMenuItemClick: setLayout,
}: LayoutSelectorProps) => {
  const activeCall = useActiveCall();

  useEffect(() => {
    activeCall?.queryRecordings();
  }, [activeCall]);

  return (
    <div className="str-video__call-header">
      <CallHeaderTitle />
      <div className="str-video__call-header__controls-group">
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
          copyValue={typeof window !== 'undefined' ? window.location.href : ''}
        />
        <CallRecordings />
        <DeviceSettings />
      </div>
    </div>
  );
};
