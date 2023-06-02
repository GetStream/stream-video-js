import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { useAudioRoomContext } from '../../contexts/AudioRoomContext/AudioRoomContext';
import RoomCard from './RoomCard';

interface RoomOverviewProps {
  showAsGrid?: Boolean;
}

const RoomOverview = ({ showAsGrid = true }: RoomOverviewProps) => {
  const { liveRooms, upcomingRooms, create, join, setRooms, updateRooms } =
    useAudioRoomContext();
  const client = useStreamVideoClient();

  useEffect(() => {
    const unsubscribe1 = client?.on('call.live_started', updateRooms);
    const unsubscribe2 = client?.on('call.ended', updateRooms);

    return () => {
      if (unsubscribe1) {
        unsubscribe1();
      }

      if (unsubscribe2) {
        unsubscribe2();
      }
    };
  }, [updateRooms, client]);

  useEffect(() => {
    console.log('Loading calls');
    if (showAsGrid) {
      client
        ?.queryCalls({
          filter_conditions: { audioRoomCall: true },
          sort: [],
          watch: true,
        })
        .then((result) => {
          console.log('Querying calls successful.');
          setRooms(result.calls);
        })
        .catch((err) => {
          console.log('Querying calls failed.');
          console.error(err);
        });
    }
  }, [client, setRooms, showAsGrid]);

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
          <button
            key={room.id}
            className="room-card-button"
            onClick={() => join(room)}
          >
            <RoomCard room={room} />
          </button>
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
