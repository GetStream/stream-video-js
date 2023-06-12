import { createContext, useCallback, useContext, useState } from 'react';
import { ChildrenOnly } from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';

type LayutController = {
  showCreateRoomModal: boolean;
  showRoomList: boolean;
  toggleShowCreateRoomModal: () => void;
  toggleShowRoomList: () => void;
};

const LayutControllerContext = createContext<LayutController>({
  showCreateRoomModal: false,
  showRoomList: false,
  toggleShowCreateRoomModal: noop,
  toggleShowRoomList: noop,
});

export const LayoutControllerProvider = ({ children }: ChildrenOnly) => {
  const [showRoomList, setShowRoomList] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  const toggleShowRoomList = useCallback(
    () => setShowRoomList((prev) => !prev),
    [],
  );

  const toggleShowCreateRoomModal = useCallback(
    () => setShowCreateRoomModal((prev) => !prev),
    [],
  );

  return (
    <LayutControllerContext.Provider
      value={{
        showCreateRoomModal,
        showRoomList,
        toggleShowCreateRoomModal,
        toggleShowRoomList,
      }}
    >
      {children}
    </LayutControllerContext.Provider>
  );
};

export const useLayoutController = () => useContext(LayutControllerContext);
