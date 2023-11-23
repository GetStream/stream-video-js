import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCallStateHooks,
  useI18n,
  VideoPreview,
  Icon,
} from '@stream-io/video-react-sdk';

import { DisabledVideoPreview } from './DisabledVideoPreview';
import { CallSettingsButton } from './CallSettingsButton';
import { LatencyMap } from './LatencyMap/LatencyMap';

import { useEdges } from '../hooks/useEdges';

type LobbyProps = {
  onJoin: () => void;
  callId?: string;
  enablePreview?: boolean;
};
export const Lobby = ({ onJoin, callId, enablePreview = true }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();

  const { t } = useI18n();
  const { edges } = useEdges();

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
    <div className="rd__lobby">
      <LatencyMap sourceData={edges} />
      <div className="rd__lobby-container">
        <div className="rd__lobby-content">
          <h1 className="rd__lobby-heading">
            {t('Set up your call')} <br /> {t('before joining!')}
          </h1>
          <div className="rd__lobby-camera">
            <VideoPreview
              DisabledVideoPreview={
                hasBrowserMediaPermission
                  ? DisabledVideoPreview
                  : AllowBrowserPermissions
              }
            />
            <div className="rd__lobby-controls">
              <div className="rd__lobby-media">
                <ToggleAudioPreviewButton />
                <ToggleVideoPreviewButton />
              </div>
              <CallSettingsButton />
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
  );
};

const AllowBrowserPermissions = () => {
  return (
    <>
      <p>Allow your browser to access your camera and microphone.</p>
      <p>Pronto needs access to your camera and microphone for the call.</p>
    </>
  );
};
