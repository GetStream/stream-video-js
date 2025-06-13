import {
  Call,
  Notification,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useI18n,
} from '@stream-io/video-react-sdk';
import { useRouter } from 'next/router';
import {
  ChangeEvent,
  ClipboardEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { useSettings } from '../../context/SettingsContext';
import { getClient } from '../../helpers/client';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { meetingId } from '../../lib/idGenerators';
import appTranslations from '../../translations';
import { DefaultAppHeader } from '../DefaultAppHeader';
import { DialingCallNotification } from './DialingCallNotification';

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
  const { t } = useI18n();

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

  const handleUserIdPaste = (
    e: ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const pastedUserIds = e.clipboardData.getData('text').split(/\s*,\s*/);
    if (pastedUserIds.length > 1) {
      e.preventDefault();
      const replaceCurrent = e.currentTarget.value ? 0 : 1;
      setUserIds((prevUserIds) => {
        const nextUserIds = [...prevUserIds];
        nextUserIds.splice(
          index + 1 - replaceCurrent,
          replaceCurrent,
          ...pastedUserIds,
        );
        nextUserIds.splice(
          nextUserIds.findLastIndex((uid) => uid !== '') + 1,
          Number.POSITIVE_INFINITY,
          '',
        );
        return nextUserIds;
      });
    }
  };

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
      {ringingCall && (
        <StreamCall call={ringingCall}>
          <DialingCallNotification onJoin={handleJoin} onLeave={handleLeave} />
        </StreamCall>
      )}
      <div className="rd__dialer-page">
        <form className="rd__dialer-form" onSubmit={handleRing}>
          {userIds.map((userId, index) => (
            <div key={index} className="rd__dialer-ringee">
              <input
                className="rd__input rd__dialer-input"
                name={`user-id-${index}`}
                type="text"
                placeholder="User ID"
                value={userId}
                data-index={index}
                data-1p-ignore
                data-testid={`callee-user-id-${index}-input`}
                disabled={!!ringingCall}
                onChange={(e) => handleUserIdChange(e, index)}
                onPaste={(e) => handleUserIdPaste(e, index)}
                onKeyDown={(e) => handleUserIdKeyDown(e, index)}
              />
              {(index !== userIds.length - 1 || userId !== '') && (
                <button
                  className="rd__button"
                  type="button"
                  aria-label="Delete user"
                  data-testid={`callee-user-id-${index}-delete`}
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
            data-testid="ring-button"
          >
            {t('Ring')}
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
