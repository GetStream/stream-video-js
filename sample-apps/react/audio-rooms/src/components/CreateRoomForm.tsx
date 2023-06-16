import { MouseEventHandler, useCallback, useState } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-sdk';
import { CloseIcon } from './icons';
import { CALL_TYPE, useLayoutController, useUserContext } from '../contexts';
import { useNavigate } from 'react-router-dom';

type CreateCallParams = {
  title: string;
  description: string;
};

type RoomFormProps = {
  close: () => void;
};
const CreateRoomForm = ({ close }: RoomFormProps) => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const client = useStreamVideoClient();
  const { toggleShowCreateRoomModal } = useLayoutController();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createCall = useCallback(
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
      const call = await createCall({ description, title });
      if (!call) return;

      setTitle('');
      setDescription('');
      toggleShowCreateRoomModal();
      navigate(`/rooms/join/${call.id}`);
    },
    [createCall, navigate, toggleShowCreateRoomModal, title, description],
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

export default CreateRoomForm;
