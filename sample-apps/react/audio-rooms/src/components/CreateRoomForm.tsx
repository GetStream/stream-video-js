import {
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { MouseEventHandler, useCallback, useState } from 'react';
import { CloseIcon } from './icons';

type RoomFormProps = {
  close: () => void;
};
const CreateRoomForm = ({ close }: RoomFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const connectedUser = useConnectedUser();
  const client = useStreamVideoClient();

  const createButtonClicked: MouseEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      if (!client) return;
      const randomId = Math.random().toString(36).substring(2, 12);
      await client.call('audio_room', randomId).getOrCreate({
        data: {
          members: [{ user_id: connectedUser?.id || '', role: 'admin' }],
          custom: {
            audioRoomCall: true,
            title: title,
            description: description,
            hosts: [
              {
                name: connectedUser?.name,
                id: connectedUser?.id,
                imageUrl: connectedUser?.image,
              },
            ],
          },
        },
      });
      setTitle('');
      setDescription('');
    },
    [title, description, connectedUser, client],
  );

  return (
    <div className="form-container">
      <div className="form-container__header">
        <div className="form-container__title">Create a room</div>
        <button className="form-container__close-button" onClick={close}>
          <CloseIcon />
        </button>
      </div>
      <form className="room-form" action="room-form">
        <input
          type="text"
          id="title"
          value={title}
          placeholder="Title"
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          type="text"
          id="description"
          value={description}
          placeholder="Description"
          onChange={(event) => setDescription(event.target.value)}
        />
        <button
          type="submit"
          disabled={!(title && description)}
          className="create-button"
          onClick={(event) => createButtonClicked(event)}
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateRoomForm;
