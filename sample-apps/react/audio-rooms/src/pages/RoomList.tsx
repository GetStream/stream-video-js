import { Link } from 'react-router-dom';
import { Call, StreamCall } from '@stream-io/video-react-sdk';
import RoomCard from '../components/RoomCard';
import {
  isEnded,
  isLive,
  isUpcoming,
  RoomLiveState,
} from '../utils/roomLiveState';
import { useLoadedCalls } from '../contexts';

const RoomList = () => {
  const { calls } = useLoadedCalls();

  return (
    <section className="rooms-overview">
      <RoomListing calls={calls.filter(isLive)} liveState="live" />
      <RoomListing calls={calls.filter(isUpcoming)} liveState="upcoming" />
      <RoomListing calls={calls.filter(isEnded)} liveState="ended" />
    </section>
  );
};

const RoomListing = ({
  calls,
  liveState,
}: {
  calls: Call[];
  liveState: RoomLiveState;
}) => {
  return (
    <div id={`${liveState}-listing-section`} className="room-listing-section">
      <h2>{liveState} audio rooms</h2>

      {calls.length ? (
        <div className="room-listing">
          {calls.map((call) => (
            <Link
              to={`/rooms/join/${call.id}`}
              key={call.id}
              className="room-card-button"
            >
              <StreamCall call={call}>
                <RoomCard />
              </StreamCall>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyListing liveState={liveState} />
      )}
    </div>
  );
};

const EmptyListing = ({ liveState }: { liveState: RoomLiveState }) => (
  <div className="room-listing--empty">No {liveState} rooms found</div>
);

export default RoomList;
