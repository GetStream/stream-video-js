import './BackstageHeader.scss';
import {
  DeviceSettings,
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-sdk';
import {
  DurationBadge,
  LiveBadge,
  StreamLogo,
  TotalViewersBadge,
} from '../../components';

export const BackstageHeader = () => {
  const call = useCall();
  const currentUser = useConnectedUser();
  const { useIsCallBroadcastingInProgress } = useCallStateHooks();
  const isBroadcasting = useIsCallBroadcastingInProgress();
  return (
    <div className="backstage-header">
      <div className="backstage-header-section pull-left">
        <StreamLogo />
        <div className="backstage-header-details">
          <h3 className="backstage-header-title">
            {call?.data?.custom.title || call?.cid || 'Livestream'}
          </h3>
          <h5 className="backstage-header-subtitle">
            {currentUser?.name || currentUser?.id || 'Stream user'}
          </h5>
        </div>
      </div>
      <div className="backstage-header-section pull-center">
        <DurationBadge />
        {isBroadcasting && <LiveBadge />}
        {isBroadcasting && <TotalViewersBadge />}
      </div>
      <div className="backstage-header-section pull-right">
        <DeviceSettings />
      </div>
    </div>
  );
};
