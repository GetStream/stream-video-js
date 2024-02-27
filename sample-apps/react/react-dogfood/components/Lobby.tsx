import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import {
  Icon,
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  useCall,
  useCallStateHooks,
  useConnectedUser,
  useI18n,
  VideoPreview,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';

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
  mode?: UserMode;
};

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const Lobby = ({ onJoin, mode = 'regular' }: LobbyProps) => {
  const call = useCall();
  const { data: session, status } = useSession();
  const { useMicrophoneState, useCameraState, useCallSession, useCallMembers } =
    useCallStateHooks();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const { hasBrowserPermission: hasCameraPermission, isMute: isCameraMute } =
    useCameraState();
  const callSession = useCallSession();
  const members = useCallMembers();
  const currentUser = useConnectedUser();

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

  const [isRequestToJoinCallSent, setIsRequestToJoinCallSent] = useState(false);
  const isCurrentUserCallMember = members.some(
    (m) => m.user_id === currentUser?.id,
  );

  if (!session) {
    return null;
  }

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;
  const hasOtherParticipants = callSession?.participants.length;
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
                  {t('Set up your call before joining')}
                </h1>
                <p className="rd__lobby-heading__description">
                  {t(
                    'while our Edge Network is selecting the best server for your call...',
                  )}
                </p>
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
                        layoutProps={{
                          selectedLayout: layout,
                          onMenuItemClick: setLayout,
                        }}
                        tabModalProps={{
                          inMeeting: false,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="rd__lobby-edge-network">
              <Image
                src={`${
                  process.env.NEXT_PUBLIC_BASE_PATH || ''
                }/lock-person.svg`}
                alt="Stream logo"
                priority={false}
                width={36}
                height={24}
              />
              <p className="rd__lobby-edge-network__description">
                You are about to {hasOtherParticipants ? 'join' : 'start '} a
                private test call via Stream. Once you{' '}
                {hasOtherParticipants ? 'join' : 'start '} the call, you can
                invite other participants.
              </p>
            </div>

            {call && call.type === 'restricted' && !isCurrentUserCallMember ? (
              <button
                className={clsx(
                  'rd__button rd__button--primary rd__button--large rd__lobby-join',
                  isRequestToJoinCallSent && 'rd__button--disabled',
                )}
                type="button"
                data-testid="request-join-call-button"
                disabled={isRequestToJoinCallSent}
                onClick={async () => {
                  // TODO OL: replace with a call action
                  await call?.sendCustomEvent({
                    type: 'pronto.request-to-join-call',
                  });
                  setIsRequestToJoinCallSent(true);
                }}
              >
                <Icon className="rd__button__icon" icon="login" />
                Request to join
              </button>
            ) : (
              <button
                className="rd__button rd__button--primary rd__button--large rd__lobby-join"
                type="button"
                data-testid="join-call-button"
                onClick={onJoin}
              >
                <Icon className="rd__button__icon" icon="login" />
                {hasOtherParticipants ? t('Join') : t('Start call')}
              </button>
            )}

            {isProntoEnvironment && (
              <div className="rd__lobby__user-modes">
                {mode === 'regular' && (
                  <Link
                    href={`${basePath}/guest/?callId=${call?.id}`}
                    className="rd__link  rd__link--faux-button"
                    children="Continue as Guest or Anonymous"
                  />
                )}
                {(mode === 'guest' || mode === 'anon') && (
                  <Link
                    href={`${basePath}/join/${call?.id}`}
                    className="rd__link  rd__link--faux-button"
                    children="Continue with Regular User"
                  />
                )}
              </div>
            )}
          </div>
          {shouldRenderMobileAppBanner && call && (
            <MobileAppBanner
              callId={call.id}
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
  return (
    <p className="rd__lobby__no-permission">
      Please grant your browser a permission to access your camera and
      microphone.
    </p>
  );
};
