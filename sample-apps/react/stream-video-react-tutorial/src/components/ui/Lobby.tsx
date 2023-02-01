import {
  ChangeEventHandler,
  FormEventHandler,
  useCallback,
  useState,
} from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { meetingId } from '../../utils';
import { useUserData } from '../../context/UserContext';

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
              <img src={user.imageUrl} alt={name} />
            </div>
            <div className="str-video-tutorial__avatar-name">{user.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CALL_TYPE = 'default';

const StartNewCallButton = () => {
  const videoClient = useStreamVideoClient();
  const startMeeting = useCallback(() => {
    return videoClient?.createCall({
      type: CALL_TYPE,
      id: meetingId(),
    });
  }, [videoClient]);

  return <button onClick={startMeeting}>Start a call</button>;
};

const JoinExistingCallForm = () => {
  const videoClient = useStreamVideoClient();
  const [joinCallId, setJoinCallId] = useState<string>('');

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setJoinCallId(event.target.value);
  };

  const joinMeeting: FormEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      await videoClient.joinCall({
        type: CALL_TYPE,
        id: joinCallId,
        datacenterId: '',
      });
    },
    [joinCallId, videoClient],
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
