import { useParams } from 'react-router-dom';
import { RoomListing } from '../components/RoomList';
import { RoomListingTabs } from '../components/RoomList/RoomListingTabs';
import { RoomLiveState, roomStates } from '../utils/roomLiveState';

const RoomList = () => {
  const { roomState } = useParams<{ roomState: RoomLiveState }>();
  const activeLiveState =
    roomState && roomStates.includes(roomState) ? roomState : 'live';

  return (
    <section className="rooms-overview">
      <RoomListingTabs activeLiveState={activeLiveState} />
      <RoomListing liveState={activeLiveState} />
    </section>
  );
};

export default RoomList;
