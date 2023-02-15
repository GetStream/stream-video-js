import {
  ChangeEventHandler,
  FormEventHandler,
  useCallback,
  useState,
} from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useUserData } from '../../context/UserContext';
import { useLoadingState } from '../../context/LoadingStateContext';

const UserSelector = () => {
  const { users, selectedUserId, setSelectedUserId } = useUserData();
  const selectedUser = users[selectedUserId];
  const name = selectedUser.name || 'Unknown name';
  return (
    <div className="str-video-tutorial__user-selector">
      <h2>Log in as:</h2>
      <div className="str-video-tutorial__user-selector__switch">
        {Object.values(users).map((user) => (
          <div
            className={`str-video-tutorial__user-selector__switch-item${
              user.id === selectedUser.id ? ' selected' : ''
            }`}
            key={user.id}
            onClick={() =>
              user.id !== selectedUser.id && setSelectedUserId(user.id)
            }
          >
            <div className="str-video-tutorial__avatar">
              <img
                src={`https://getstream.io/random_svg/?id=${name}&name=${name}`}
                alt={name}
              />
            </div>
            <div className="str-video-tutorial__avatar-name">{user.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const StartNewCallButton = () => {
  const videoClient = useStreamVideoClient();
  const { setLoading } = useLoadingState();

  const startMeeting = useCallback(async () => {
    setLoading(true);
    try {
      await videoClient.joinCall(
        String(Math.round(Math.random() * 100000000)),
        'default',
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setLoading, videoClient]);

  return <button onClick={startMeeting}>Start a call</button>;
};

const JoinExistingCallForm = () => {
  const videoClient = useStreamVideoClient();
  const { setLoading } = useLoadingState();
  const [joinCallId, setJoinCallId] = useState<string>('');

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setJoinCallId(event.target.value);
  };

  const joinMeeting: FormEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      setLoading(true);
      try {
        await videoClient.joinCall(joinCallId, 'default');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, joinCallId, videoClient],
  );

  return (
    <form onSubmit={joinMeeting}>
      <input onChange={handleChange} value={joinCallId} />
      <button disabled={!joinCallId} type="submit">
        Join
      </button>
    </form>
  );
};

export const Lobby = () => {
  return (
    <div className="str-video-tutorial__lobby">
      <UserSelector />
      <div className="str-video-tutorial__lobby__start-call-btn-group">
        <StartNewCallButton />
        <JoinExistingCallForm />
      </div>
    </div>
  );
};
