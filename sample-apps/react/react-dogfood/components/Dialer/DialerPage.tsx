import {
  Call,
  Notification,
  RingingCall,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useSettings } from '../../context/SettingsContext';
import { customSentryLogger } from '../../helpers/logger';
import { ServerSideCredentialsProps } from '../../lib/getServerSideCredentialsProps';
import { DefaultAppHeader } from '../DefaultAppHeader';
import { useRouter } from 'next/router';
import { meetingId } from '../../lib/idGenerators';

export const DialerPage = ({
  apiKey,
  user,
  userToken,
}: ServerSideCredentialsProps) => {
  const {
    settings: { language, fallbackLanguage },
  } = useSettings();
  const [error, setError] = useState<Error | undefined>();
  const [loading, setLoading] = useState(false);
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const router = useRouter();
  const callType = (router.query['type'] as string) || 'default';
  const [userIds, setUserIds] = useState(['']);
  const [ringingCall, setRingingCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token: userToken,
      options: { logLevel: 'info', logger: customSentryLogger() },
    });
    setVideoClient(_client);

    window.client = _client;

    return () => {
      _client
        .disconnectUser()
        .catch((e) => console.error(`Couldn't disconnect user`, e));
      setVideoClient(undefined);
    };
  }, [apiKey, user, userToken]);

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
      setLoading(true);
      await call.getOrCreate({ ring: true, data: { members } });
      setRingingCall(call);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearError = useCallback(() => setError(undefined), []);

  if (!videoClient) {
    return null;
  }

  return (
    <StreamVideo
      client={videoClient}
      language={language}
      fallbackLanguage={fallbackLanguage}
    >
      <DefaultAppHeader />
      <div className="rd__dialer-page">
        {ringingCall ? (
          <StreamCall call={ringingCall}>
            <RingingCall />
          </StreamCall>
        ) : (
          <>
            <form className="rd__dialer-form" onSubmit={handleRing}>
              {userIds.map((userId, index) => (
                <div key={index} className="rd__dialer-ringee">
                  <input
                    className="rd__input rd__dialer-input"
                    type="text"
                    placeholder="User ID"
                    value={userId}
                    data-index={index}
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
              <button type="submit" className="rd__button rd__button--primary">
                Ring
              </button>
              <div className="rd__dialer-notifications">
                <Notification
                  isVisible={!!error}
                  close={handleClearError}
                  message={
                    <div className="rd__dialer-notification">
                      {error?.message}
                    </div>
                  }
                  placement="top-end"
                />
              </div>
            </form>
          </>
        )}
      </div>
    </StreamVideo>
  );
};
