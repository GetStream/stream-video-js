import { createContext, useCallback, useContext, useState } from 'react';
import { ChildrenOnly } from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';

type LayoutController = {
  showCreateRoomModal: boolean;
  showRoomList: boolean;
  toggleShowCreateRoomModal: () => void;
  toggleShowRoomList: () => void;
};

const LayoutControllerContext = createContext<LayoutController>({
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
    <LayoutControllerContext.Provider
      value={{
        showCreateRoomModal,
        showRoomList,
        toggleShowCreateRoomModal,
        toggleShowRoomList,
      }}
    >
      {children}
    </LayoutControllerContext.Provider>
  );
};

export const useLayoutController = () => useContext(LayoutControllerContext);
