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
import Link from 'next/link';
import { isAndroid, isIOS, isSafari } from 'mobile-device-detect';

import { DisabledVideoPreview } from './DisabledVideoPreview';
import { LatencyMap } from './LatencyMap/LatencyMap';
import { MobileAppBanner } from './MobileAppBanner';
import { ToggleSettingsTabModal } from './Settings/SettingsTabModal';
import { ToggleMicButton } from './ToggleMicButton';
import { ToggleCameraButton } from './ToggleCameraButton';
import { ToggleParticipantsPreviewButton } from './ToggleParticipantsPreview';

import { useEdges } from '../hooks/useEdges';
import { DefaultAppHeader } from './DefaultAppHeader';
import { useLayoutSwitcher } from '../hooks';
import {
  useIsDemoEnvironment,
  useIsProntoEnvironment,
} from '../context/AppEnvironmentContext';

export type UserMode = 'regular' | 'guest' | 'anon';

export type LobbyProps = {
  onJoin: () => void;
  callId?: string;
  mode?: UserMode;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const Lobby = ({ onJoin, callId, mode = 'regular' }: LobbyProps) => {
  const { data: session, status } = useSession();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission, isMute: isCameraMute } =
    useCameraState();

  const { t } = useI18n();
  const { edges } = useEdges();

  const { layout, setLayout } = useLayoutSwitcher();

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

  const isProntoEnvironment = useIsProntoEnvironment();
  const isDemoEnvironment = useIsDemoEnvironment();
  const [shouldRenderMobileAppBanner, setShouldRenderMobileAppBanner] =
    useState(isDemoEnvironment && (isAndroid || (isIOS && !isSafari)));

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
            {mode !== 'anon' && (
              <>
                <h1 className="rd__lobby-heading">
                  Set up your call before joining!
                </h1>
                <div
                  className={clsx(
                    'rd__lobby-camera',
                    isCameraMute && 'rd__lobby-camera--off',
                  )}
                >
                  <div className="rd__lobby-video-preview">
                    <VideoPreview
                      DisabledVideoPreview={
                        hasBrowserMediaPermission
                          ? DisabledVideoPreview
                          : AllowBrowserPermissions
                      }
                    />
                    <div className="rd__lobby-media-toggle">
                      <ToggleAudioPreviewButton />
                      <ToggleVideoPreviewButton />
                    </div>
                  </div>
                  <div className="rd__lobby-controls">
                    <div className="rd__lobby-media">
                      <ToggleMicButton />
                      <ToggleCameraButton />
                    </div>

                    <div className="rd__lobby-settings">
                      <ToggleParticipantsPreviewButton onJoin={onJoin} />

                      <ToggleSettingsTabModal
                        selectedLayout={layout}
                        onMenuItemClick={setLayout}
                        inMeeting={false}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            <button
              className="rd__button rd__button--primary rd__button--large rd__lobby-join"
              data-testid="join-call-button"
              onClick={onJoin}
            >
              <Icon className="rd__button__icon" icon="login" />
              {t('Join')}
            </button>

            {isProntoEnvironment && (
              <div className="rd__lobby__user-modes">
                {mode === 'regular' && (
                  <Link
                    href={`${basePath}/guest/?callId=${callId}`}
                    className="rd__link  rd__link--faux-button"
                    children="Continue as Guest or Anonymous"
                  />
                )}
                {(mode === 'guest' || mode === 'anon') && (
                  <Link
                    href={`${basePath}/join/${callId}`}
                    className="rd__link  rd__link--faux-button"
                    children="Continue with Regular User"
                  />
                )}
              </div>
            )}
          </div>
          {shouldRenderMobileAppBanner && (
            <MobileAppBanner
              callId={callId!}
              platform={isAndroid ? 'android' : 'ios'}
              onDismiss={() => setShouldRenderMobileAppBanner(false)}
            />
          )}
        </div>
      </div>
    </>
  );
};

const AllowBrowserPermissions = () => {
  return <p>Please allow your browser to access your camera and microphone.</p>;
};
