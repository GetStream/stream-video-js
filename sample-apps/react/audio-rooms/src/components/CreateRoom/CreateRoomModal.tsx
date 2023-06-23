import { MouseEventHandler, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { CloseIcon } from '../icons';
import { useUserContext } from '../../contexts';
import {
  generateRoomId,
  generateRoomPayload,
} from '../../utils/generateRoomData';
import { CALL_TYPE } from '../../utils/constants';

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
      const call = client.call(CALL_TYPE, generateRoomId());
      await call.getOrCreate(generateRoomPayload({ user, ...params }));
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
