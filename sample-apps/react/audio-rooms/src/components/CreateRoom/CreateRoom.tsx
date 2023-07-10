import { AddIcon } from '../icons';
import { useCallback, useState } from 'react';
import { CreateRoomModal } from './CreateRoomModal';

export const CreateRoom = () => {
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const toggleShowCreateRoomModal = useCallback(
    () => setShowCreateRoomModal((prev) => !prev),
    [],
  );
  return (
    <>
      <button
        className="open-create-room-button filled-button filled-button--blue"
        onClick={toggleShowCreateRoomModal}
        title="Create a room"
      >
        <AddIcon />
        <span>Room</span>
      </button>
      {/* todo: close modal on click outside */}
      {showCreateRoomModal && (
        <CreateRoomModal close={toggleShowCreateRoomModal} />
      )}
    </>
  );
};
