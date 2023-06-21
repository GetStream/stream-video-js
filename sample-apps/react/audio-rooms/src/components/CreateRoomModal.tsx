import { MouseEventHandler, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { CloseIcon } from './icons';
import { CALL_TYPE, useUserContext } from '../contexts';

type CreateCallParams = {
  title: string;
  description: string;
};

type CreateRoomModalProps = {
  close: () => void;
};

export const CreateRoomModal = ({ close }: CreateRoomModalProps) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const client = useStreamVideoClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createRoom = useCallback(
    async (params: CreateCallParams) => {
      if (!(client && user)) return;
      const randomId = Math.random().toString(36).substring(2, 12);
      const call = client.call(CALL_TYPE, randomId);
      await call.getOrCreate({
        data: {
          members: [{ user_id: user.id, role: 'admin' }],
          custom: {
            title: params.title,
            description: params.description,
            hosts: [user],
          },
        },
      });
      return call;
    },
    [client, user],
  );

  const handleSubmit: MouseEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      const room = await createRoom({ description, title });
      if (!room) return;

      setTitle('');
      setDescription('');
      close();
      navigate(`/rooms/join/${room.id}`);
    },
    [createRoom, navigate, close, title, description],
  );

  return (
    <div className="form-modal-background-overlay">
      <div className="form-container">
        <div className="form-container__header">
          <div className="form-container__title">Create a room</div>
          <button className="form-container__close-button" onClick={close}>
            <CloseIcon />
          </button>
        </div>
        <form className="room-form">
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
            onClick={handleSubmit}
          >
            Create
          </button>
        </form>
      </div>
    </div>
  );
};
