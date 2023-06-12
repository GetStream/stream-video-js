import { MouseEventHandler, useCallback, useState } from 'react';
import { CloseIcon } from './icons';
import { useLoadedCalls, useLayoutController } from '../contexts';

type RoomFormProps = {
  close: () => void;
};
const CreateRoomForm = ({ close }: RoomFormProps) => {
  const { createCall } = useLoadedCalls();
  const { toggleShowCreateRoomModal } = useLayoutController();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const createButtonClicked: MouseEventHandler = useCallback(
    async (event) => {
      event.preventDefault();
      await createCall({ description, title });
      setTitle('');
      setDescription('');
      toggleShowCreateRoomModal();
    },
    [createCall, toggleShowCreateRoomModal, title, description],
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
    </div>
  );
};

export default CreateRoomForm;
