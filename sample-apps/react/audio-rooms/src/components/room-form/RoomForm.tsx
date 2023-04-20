import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useState } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from '../../contexts/UserContext/UserContext';
import { CloseIcon } from '../icons';
import './RoomForm.css';

function RoomForm(): JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const client = useStreamVideoClient();
  const { user } = useUserContext();
  const { roomCreated } = useAudioRoomContext();

  return (
    <section className="form-container">
      <div className="title-row">
        <button onClick={() => roomCreated()}>
          <CloseIcon />
        </button>
        <h2>Create a room</h2>
      </div>
      <form className="room-form" action="">
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
          className="create-button"
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
    const call = client?.call('audio_room', randomId);
    call?.getOrCreate({
      data: {
        members: [{ user_id: user?.id || '', role: 'admin' }],
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
