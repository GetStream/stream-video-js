import { RoomLiveState, roomStates } from '../../utils/roomLiveState';
import { useNavigate } from 'react-router-dom';

type RoomListingTabsProps = {
  activeLiveState: RoomLiveState;
  onSelect?: (state: RoomLiveState) => void;
};

export const RoomListingTabs = ({
  activeLiveState,
  onSelect,
}: RoomListingTabsProps) => {
  const navigate = useNavigate();

  return (
    <div className="room-listing-tabs">
      {roomStates.map((state) => (
        <button
          className={`room-listing-tab ${
            state === activeLiveState ? 'active' : ''
          }`}
          key={`${state}-room-listing-tab`}
          onClick={() => {
            if (onSelect) {
              onSelect(state);
            } else {
              navigate(`/rooms/${state}`);
            }
          }}
        >
          {state}
        </button>
      ))}
    </div>
  );
};
