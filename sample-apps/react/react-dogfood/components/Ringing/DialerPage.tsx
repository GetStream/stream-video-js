import {
  Call,
  CallingState,
  CancelCallButton,
  Notification,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { DefaultAppHeader } from '../DefaultAppHeader';
import { useRouter } from 'next/router';
import { meetingId } from '../../lib/idGenerators';
import { getClient } from '../../helpers/client';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import appTranslations from '../../translations';

export const DialerPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language, fallbackLanguage },
  } = useSettings();
  const [error, setError] = useState<Error | undefined>();
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const router = useRouter();
  const callType = (router.query['type'] as string) || 'default';
  const [userIds, setUserIds] = useState(['']);
  const [ringingCall, setRingingCall] = useState<Call | undefined>(undefined);
  const environment = useAppEnvironment();

  useEffect(() => {
    const _client = getClient({ apiKey, user, userToken }, environment);
    setVideoClient(_client);

    window.client = _client;

    return () => {
      setVideoClient(undefined);
      window.client = undefined;
    };
  }, [apiKey, user, userToken, environment]);

  const handleUserIdChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>, index: number) => {
      const value = e.currentTarget.value;
      setUserIds((prevUserIds) => {
        const nextUserIds = [...prevUserIds];
        nextUserIds[index] = value;
        nextUserIds.splice(
          nextUserIds.findLastIndex((uid) => uid !== '') + 1,
          Number.POSITIVE_INFINITY,
          '',
        );
        return nextUserIds;
      });
    },
    [],
  );

  const handleUserIdKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === 'Enter' && e.currentTarget.value !== '') {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>(
            `.rd__dialer-input[data-index="${index + (e.shiftKey ? -1 : +1)}"]`,
          )
          ?.select();
      }
    },
    [],
  );

  const handleDeleteUserId = useCallback((index: number) => {
    setUserIds((prevUserIds) => prevUserIds.filter((_, i) => i !== index));
  }, []);

  const handleRing = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!videoClient) {
      return;
    }

    const call = videoClient.call(callType, meetingId());
    const members = userIds
      .filter((uid) => uid !== '')
      .map((uid) => ({ user_id: uid }));

    try {
      setRingingCall(call);
      await call.getOrCreate({
        ring: true,
        data: {
          members,
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 60_000,
              incoming_call_timeout_ms: 60_000,
              missed_call_timeout_ms: 5000,
            },
          },
        },
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        setRingingCall(undefined);
      }
    }
  };

  const handleJoin = () => {
    if (ringingCall) {
      router.push(`/join/${ringingCall.id}?skip_lobby=true`);
    }
  };

  const handleLeave = () => {
    setRingingCall(undefined);
  };

  const handleClearError = useCallback(() => setError(undefined), []);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo
      client={videoClient}
      translationsOverrides={appTranslations}
      language={language}
      fallbackLanguage={fallbackLanguage}
    >
      <DefaultAppHeader />
      <div className="rd__dialer-page">
        {ringingCall && (
          <StreamCall call={ringingCall}>
            <DialingCallNotification
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          </StreamCall>
        )}

        <form className="rd__dialer-form" onSubmit={handleRing}>
          {userIds.map((userId, index) => (
            <div key={index} className="rd__dialer-ringee">
              <input
                className="rd__input rd__dialer-input"
                type="text"
                placeholder="User ID"
                value={userId}
                data-index={index}
                disabled={!!ringingCall}
                onChange={(e) => handleUserIdChange(e, index)}
                onKeyDown={(e) => handleUserIdKeyDown(e, index)}
              />
              {(index !== userIds.length - 1 || userId !== '') && (
                <button
                  className="rd__button"
                  type="button"
                  aria-label="Delete user"
                  onClick={() => handleDeleteUserId(index)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="rd__button rd__button--primary"
            disabled={!!ringingCall}
          >
            Ring
          </button>
          <div className="rd__dialer-notifications">
            <Notification
              isVisible={!!error}
              close={handleClearError}
              message={
                <div className="rd__dialer-notification">{error?.message}</div>
              }
              placement="top-end"
            />
          </div>
        </form>
      </div>
    </StreamVideo>
  );
};

interface DialingCallNotificationProps {
  onJoin: () => void;
  onLeave: () => void;
}

function DialingCallNotification(props: {
  onJoin: () => void;
  onLeave: () => void;
}) {
  const { t } = useI18n();
  const call = useCall();
  const { useCallCallingState, useCallMembers } = useCallStateHooks();
  const callingState = useCallCallingState();
  const otherMembers = useCallMembers().filter(
    (m) => m.user_id !== call?.state.createdBy?.id,
  );
  const callbackRefs = useRef<DialingCallNotificationProps>(null);
  callbackRefs.current = props;

  useEffect(() => {
    if (callingState === CallingState.JOINED) {
      callbackRefs.current?.onJoin();
    } else if (callingState === CallingState.LEFT) {
      callbackRefs.current?.onLeave();
    }
  }, [callingState]);

  const handleReject = () => {
    if (call) {
      call.leave({ reject: true, reason: 'cancel' }).catch((err) => {
        console.error('Failed to cancel rining call', err);
      });
    }
  };

  if (!call) {
    return null;
  }

  return (
    <div className="rd__dialer-ringing-call">
      <Notification
        isVisible
        placement="bottom"
        message={
          <div className="rd__dialer-ringing-call-notification">
            <div>
              {t('Ringing {{ count }} members', { count: otherMembers.length })}
            </div>
            <CancelCallButton onClick={handleReject} />
          </div>
        }
      />
    </div>
  );
}
