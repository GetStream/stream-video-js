import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useState } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';

function RoomForm(): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const client = useStreamVideoClient();
  const { user } = useUserContext();
  const { roomCreated } = useAudioRoomContext();

  return (
    <section>
      <h2>Create a room</h2>
      <form action="">
        <label htmlFor="title">
          <span>Title</span>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label htmlFor="description">
          <span>Description</span>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={isButtonDisabled()}
          onClick={(event) => createButtonClicked(event)}
        >
          Create
        </button>
      </form>
    </section>
  );

  function isButtonDisabled(): boolean {
    return !title || !description;
  }

  async function createButtonClicked(event: React.MouseEvent) {
    event.preventDefault();
    const randomId = Math.random().toString(36).substring(2, 12);
    const result = await client?.getOrCreateCall(randomId, 'audio_room', {
      data: {
        custom: {
          audioRoomCall: true,
          title: title,
          description: description,
          hosts: [
            {
              name: user?.name,
              id: user?.id,
              imageUrl: user?.imageUrl,
            },
          ],
        },
      },
    });

    setTitle('');
    setDescription('');
    roomCreated();
  }
}

export default RoomForm;
