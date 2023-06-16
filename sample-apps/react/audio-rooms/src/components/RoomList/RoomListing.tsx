import { RoomLiveState } from '../../utils/roomLiveState';
import { CALL_TYPE } from '../../contexts';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LoadingPanel } from '../Loading';
import { ErrorPanel } from '../Error';
import { Link } from 'react-router-dom';
import {
  Call,
  CallEndedEvent,
  CallLiveStartedEvent,
  EventHandler,
  QueryCallsRequest,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { RoomCard } from './RoomCard';

const queryCallsParams: QueryCallsRequest = {
  sort: [{ direction: -1, field: 'created_at' }],
  limit: 10,
  watch: true,
};

const CALL_TYPE_FILTER = { type: CALL_TYPE };

const BY_ROOM_STATE_FILTER: Record<
  RoomLiveState,
  QueryCallsRequest['filter_conditions']
> = {
  upcoming: {
    ...CALL_TYPE_FILTER,
    backstage: true,
    ended_at: null,
  },
  live: {
    ...CALL_TYPE_FILTER,
    backstage: false,
    ended_at: null,
  },
  ended: {
    ...CALL_TYPE_FILTER,
    ended_at: { $lte: new Date().toISOString() },
  },
};

export const RoomListing = ({ liveState }: { liveState: RoomLiveState }) => {
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingError, setLoadingError] = useState<Error | undefined>();
  const nextPage = useRef<string | undefined>();

  const loadCalls = useCallback(async () => {
    if (!client) return;
    const result = await client.queryCalls({
      ...queryCallsParams,
      filter_conditions: liveState
        ? BY_ROOM_STATE_FILTER[liveState]
        : CALL_TYPE_FILTER,
      next: nextPage.current,
    });

    if (result) {
      nextPage.current = result.next;
      setCalls((prev) => [...prev, ...result.calls]);
    }
  }, [client, liveState, nextPage]);

  useEffect(() => {
    setLoadingCalls(true);
    loadCalls()
      .catch(setLoadingError)
      .finally(() => setLoadingCalls(false));
  }, [loadCalls]);

  useEffect(() => {
    if (!client) return;
    const handleGoLive: EventHandler = async (event) => {
      const { call: callResponse } = event as CallLiveStartedEvent;
      if (liveState === 'live') {
        const newCall = client.call(callResponse.type, callResponse.id);
        await newCall.get();
        setCalls((prevCalls) => [newCall, ...prevCalls]);
      } else if (liveState === 'upcoming') {
        setCalls((prevCalls) =>
          prevCalls.filter((c) => c.cid !== callResponse.cid),
        );
      }
    };
    client.on('call.live_started', handleGoLive);
  }, [client, liveState]);

  useEffect(() => {
    if (!client) return;
    const handleCallEnded: EventHandler = async (event) => {
      const { call_cid } = event as CallEndedEvent;
      const [type, id] = call_cid.split(':');
      if (liveState === 'ended') {
        const newCall = client.call(type, id);
        await newCall.get();
        setCalls((prevCalls) => [newCall, ...prevCalls]);
      } else if (liveState === 'live') {
        setCalls((prevCalls) => prevCalls.filter((c) => c.cid === call_cid));
      }
    };
    client.on('call.ended', handleCallEnded);
  }, [client, liveState]);

  let content = <EmptyListing liveState={liveState} />;

  if (loadingCalls) {
    content = <LoadingPanel />;
  }
  if (loadingError) {
    content = <ErrorPanel error={loadingError} />;
  }
  if (calls.length) {
    content = (
      <>
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
        <div className="room-listing__load-more-container">
          {nextPage.current ? (
            <button
              className="filled-button filled-button--blue"
              onClick={loadCalls}
            >
              {loadingCalls ? 'Loading...' : `Load more ${liveState} rooms`}
            </button>
          ) : (
            <div>There are no more {liveState} rooms</div>
          )}
        </div>
      </>
    );
  }

  return (
    <div id={`${liveState}-listing-section`} className="room-listing-section">
      <h2>{liveState} audio rooms</h2>
      {content}
    </div>
  );
};
const EmptyListing = ({ liveState }: { liveState: RoomLiveState }) => (
  <div className="room-listing--empty">No {liveState} rooms found</div>
);
