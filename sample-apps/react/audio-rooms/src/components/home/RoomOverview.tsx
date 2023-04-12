import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useCallback, useEffect } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import RoomCard from './RoomCard';

interface RoomOverviewProps {
  showAsGrid?: Boolean;
}

const RoomOverview = ({ showAsGrid = true }: RoomOverviewProps) => {
  const { liveRooms, upcomingRooms, join, setRooms } = useAudioRoomContext();
  const client = useStreamVideoClient();

  const loadCalls = useCallback(async () => {
    console.log('Loading calls');
    client?.queryCalls({ audioRoomCall: true }, []).then((result) => {
      console.log('Querying calls successful.');
      setRooms(result.calls);
    });
  }, [client, setRooms]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  return (
    <section>
      <h2>Live audio rooms</h2>
      <div className={showAsGrid ? 'rooms-grid' : 'rooms-rows'}>
        {liveRooms.map((room) => (
          <button
            key={room.id}
            className="room-card"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
        ))}
      </div>
      <h2>Upcoming audio rooms</h2>
      <div className={showAsGrid ? 'rooms-grid' : 'rooms-rows'}>
        {upcomingRooms.map((room) => (
          <button
            key={room.id}
            className="room-card"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
        ))}
      </div>
    </section>
  );
};

export default RoomOverview;
