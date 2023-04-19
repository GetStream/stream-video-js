import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import RoomCard from './RoomCard';

interface RoomOverviewProps {
  showAsGrid?: Boolean;
}

const RoomOverview = ({ showAsGrid = true }: RoomOverviewProps) => {
  const { liveRooms, upcomingRooms, create, join, setRooms } =
    useAudioRoomContext();
  const client = useStreamVideoClient();

  useEffect(() => {
    console.log('Loading calls');
    client?.queryCalls({ audioRoomCall: true }, []).then((result) => {
      console.log('Querying calls successful.');
      setRooms(result.calls);
    });
  }, [client]);

  return (
    <section className="rooms-overview">
      <h2>Live audio rooms</h2>
      <div className={showAsGrid ? 'rooms-grid' : 'rooms-rows'}>
        {liveRooms.map((room) => (
          <button
            key={room.id}
            className="room-card-button"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
        ))}
      </div>
      <h2>Upcoming audio rooms</h2>
      <div className={showAsGrid ? 'rooms-grid' : 'rooms-rows'}>
        {upcomingRooms.map((room) => (
          <RoomCard room={room} />
        ))}
      </div>
      <button
        className="start-room-button"
        onClick={() => {
          create();
        }}
      >
        + Start room
      </button>
    </section>
  );
};

export default RoomOverview;
