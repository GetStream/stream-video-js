import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import {
  CallParticipantsList,
  PermissionRequests,
  SpeakingWhileMutedNotification,
} from '../../components';

import { useLayout } from '../hooks';
import { ConnectionNotification } from '../shared';
import { CallControls } from './CallControls';

/**
 * CallLayout renders the in-call experience with layout, controls, and sidebar.
 */
export const CallLayout = () => {
  const [showParticipants, setShowParticipants] = useState(false);
  const { Component: LayoutComponent, props: layoutProps } = useLayout();

  const handleToggleParticipants = useCallback(() => {
    setShowParticipants((prev) => !prev);
  }, []);

  return (
    <div className="str-video__embedded-call">
      <div className="str-video__embedded-main-panel">
        <ConnectionNotification />
        <PermissionRequests />
        <div className="str-video__embedded-notifications">
          <Restricted
            requiredGrants={[OwnCapability.SEND_AUDIO]}
            hasPermissionsOnly
          >
            <SpeakingWhileMutedNotification />
          </Restricted>
        </div>
        <div className="str-video__embedded-layout">
          <div className="str-video__embedded-layout__stage">
            <LayoutComponent {...layoutProps} />
          </div>

          <div
            className={clsx(
              'str-video__embedded-sidebar',
              showParticipants && 'str-video__embedded-sidebar--open',
            )}
          >
            {showParticipants && (
              <div className="str-video__embedded-sidebar__container">
                <div className="str-video__embedded-participants">
                  <CallParticipantsList onClose={handleToggleParticipants} />
                </div>
              </div>
            )}
          </div>
        </div>
        <CallControls
          showParticipants={showParticipants}
          onToggleParticipants={handleToggleParticipants}
        />
      </div>
    </div>
  );
};
