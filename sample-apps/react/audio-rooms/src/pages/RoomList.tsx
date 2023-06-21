import { useParams } from 'react-router-dom';
import { RoomLiveState, roomStates } from '../utils/roomLiveState';
import { RoomListing } from '../components/RoomList';

const RoomList = () => {
  const { roomState } = useParams<{ roomState: RoomLiveState }>();

  if (roomState && roomStates.includes(roomState)) {
    return (
      <section className="rooms-overview">
        <RoomListing liveState={roomState} />
      </section>
    );
  }

  return (
    <section className="rooms-overview">
      <RoomListing liveState="live" />
      <RoomListing liveState="upcoming" />
      <RoomListing liveState="ended" />
    </section>
  );
};

export default RoomList;
