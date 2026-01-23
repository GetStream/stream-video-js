import { useState, useEffect } from 'react';
import {
  CancelCallButton,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  DeviceSelectorVideo,
  LoadingIndicator,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const HostControls = () => {
  return (
    <div className="rd__host-controls">
      <div className="rd__host-controls__inner">
        <div className="rd__host-controls__media-group">
          <ToggleAudioPublishingButton
            Menu={
              <>
                <DeviceSelectorAudioOutput visualType="list" title="Speaker" />
                <DeviceSelectorAudioInput
                  visualType="list"
                  title="Microphone"
                />
              </>
            }
            menuPlacement="top"
          />
          <ToggleVideoPublishingButton
            Menu={<DeviceSelectorVideo visualType="list" />}
            menuPlacement="top"
          />
          <CancelCallButton />
        </div>
        <StartStreamButton />
      </div>
    </div>
  );
};

const StartStreamButton = () => {
  const call = useCall();
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, [isLive]);

  const handleToggleLive = async () => {
    if (!call) return;

    setIsLoading(true);
    try {
      if (isLive) {
        await call.stopLive();
      } else {
        await call.goLive();
      }
    } catch (err) {
      console.error('Failed to toggle live state', err);
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`rd__start-stream-button ${isLive ? 'rd__start-stream-button--live' : ''}`}
      onClick={handleToggleLive}
      disabled={isLoading}
    >
      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          <span className="rd__broadcast-icon" />
          <span>{isLive ? 'End Stream' : 'Start Stream'}</span>
        </>
      )}
    </button>
  );
};
