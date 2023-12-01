import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  Icon,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  useI18n,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';

import { DisabledVideoPreview } from './DisabledVideoPreview';
import { LatencyMap } from './LatencyMap/LatencyMap';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';

import { DEFAULT_LAYOUT, getLayoutSettings, LayoutMap } from './LayoutSelector';

import { useEdges } from '../hooks/useEdges';
import { DefaultAppHeader } from './DefaultAppHeader';

type LobbyProps = {
  onJoin: () => void;
  callId?: string;
  enablePreview?: boolean;
};
export const Lobby = ({ onJoin, callId, enablePreview = true }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const {
    hasBrowserPermission: hasMicPermission,
    selectedDevice: selectedMic,
    devices: microphones,
  } = useMicrophoneState();
  const {
    hasBrowserPermission: hasCameraPermission,
    selectedDevice: selectedCamera,
    devices: cameras,
    isMute: isCameraMute,
  } = useCameraState();

  const { t } = useI18n();
  const { edges } = useEdges();

  const [layout, setLayout] = useState<keyof typeof LayoutMap>(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout;

    if (!storedLayout) return DEFAULT_LAYOUT;

    return Object.hasOwn(LayoutMap, storedLayout)
      ? storedLayout
      : DEFAULT_LAYOUT;
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      void signIn();
    }
  }, [status]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SKIP_LOBBY !== 'true') return;
    const id = setTimeout(() => {
      onJoin();
    }, 500);
    return () => {
      clearTimeout(id);
    };
  }, [onJoin]);

  if (!session) {
    return null;
  }

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  return (
    <>
      <DefaultAppHeader transparent />
      <div className="rd__lobby">
        <LatencyMap sourceData={edges} />
        <div className="rd__lobby-container">
          <div className="rd__lobby-content">
            <h1 className="rd__lobby-heading">
              Set up your call before joining!
            </h1>
            <div
              className={clsx(
                'rd__lobby-camera',
                isCameraMute && 'rd__lobby-camera--off',
              )}
            >
              <VideoPreview
                DisabledVideoPreview={
                  hasBrowserMediaPermission
                    ? DisabledVideoPreview
                    : AllowBrowserPermissions
                }
              />
              <div className="rd__lobby-controls">
                <div className="rd__lobby-media">
                  <ToggleAudioPreviewButton
                    caption={
                      microphones?.find((mic) => mic.deviceId === selectedMic)
                        ?.label || t('Default')
                    }
                  />
                  <ToggleVideoPreviewButton
                    caption={
                      cameras?.find(
                        (camera) => camera.deviceId === selectedCamera,
                      )?.label || t('Default')
                    }
                  />
                </div>
                <ToggleSettingsTabModal
                  selectedLayout={layout}
                  onMenuItemClick={setLayout}
                  inMeeting={false}
                />
              </div>
            </div>

            <button
              className="rd__button rd__button--primary rd__lobby-join"
              data-testid="join-call-button"
              onClick={onJoin}
            >
              <Icon className="rd__button__icon" icon="login" />
              {t('Join')}
            </button>

            <div className="rd__lobby-edge-network">
              <Icon className="rd__lobby-edge-network__icon" icon="language" />
              <p className="rd__lobby-edge-network__description">
                {t(
                  'Our edge-network is selecting the best server for your call...',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AllowBrowserPermissions = () => {
  return <p>Please allow your browser to access your camera and microphone.</p>;
};
