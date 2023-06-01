import { StreamVideoClient } from '@stream-io/video-client';
import { useAudioRoomContext } from '../../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../../contexts/UserContext/UserContext';

export default function UserRow({
  client,
}: {
  client: StreamVideoClient;
}): JSX.Element {
  const { user, logout } = useUserContext();
  const { create } = useAudioRoomContext();

  return (
    <section className="home-user-row">
      <div>
        <img src={user?.imageUrl} alt={`Profile of ${user?.name}`}></img>
        <h3>@{user?.name}</h3>
      </div>
      <button onClick={() => logout(client)}>Sign out</button>
      <button
        onClick={() => {
          create();
        }}
      >
        + Start room
      </button>
    </section>
  );
}
