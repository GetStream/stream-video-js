import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Call,
  ChildrenOnly,
  StreamVideo,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';
import { useUserContext } from './UserContext';

type CreateCallParams = {
  title: string;
  description: string;
};

type CallContext = {
  joinedCall?: Call;
  setJoinedCall: (call?: Call) => void;
  calls: Call[];
  createCall: ({ description, title }: CreateCallParams) => void;
  loadingCalls: boolean;
  loadMoreCalls: () => Promise<void>;
  setCalls: (calls: Call[]) => void;
  loadingError?: Error;
};

const CallsContext = createContext<CallContext>({
  joinedCall: undefined,
  setJoinedCall: noop,
  calls: [],
  createCall: () => Promise.resolve(),
  loadingCalls: false,
  loadMoreCalls: () => Promise.resolve(),
  setCalls: noop,
});

const queryCallsParams = {
  filter_conditions: { audioRoomCall: true },
  sort: [],
  watch: true,
  limit: 25,
};

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;

export const CallsProvider = ({ children }: ChildrenOnly) => {
  const { user } = useUserContext();
  const client = useMemo(() => {
    if (!user) {
      return undefined;
    }
    return new StreamVideoClient({
      apiKey,
      user: {
        id: user.id,
        image: user.imageUrl,
        name: user.name,
      },
      token: user?.token,
    });
  }, [user]);
  const [joinedCall, setJoinedCall] = useState<Call>();
  const [calls, setCalls] = useState<CallContext['calls']>([]);
  const [loadingCalls, setLoadingCalls] = useState(true);
  const [loadingError, setLoadingError] = useState<Error | undefined>();
  const nextPointer = useRef<string | undefined>();

  const loadMoreCalls = useCallback(async () => {
    const result = await client?.queryCalls({
      ...queryCallsParams,
      next: nextPointer.current,
    });
    if (!result) return;

    setCalls((prev) => [...prev, ...result.calls]);
    nextPointer.current = result.next;
  }, [client]);

  const createCall = useCallback(
    async ({ description, title }: { title: string; description: string }) => {
      if (!(client && user)) return;
      const { token, ...userData } = user;
      const randomId = Math.random().toString(36).substring(2, 12);
      const call = client.call('audio_room', randomId);
      await call.getOrCreate({
        data: {
          members: [{ user_id: user.id, role: 'admin' }],
          custom: {
            audioRoomCall: true,
            title: title,
            description: description,
            hosts: [userData],
          },
        },
      });
      setCalls((prevCalls) => [call, ...prevCalls]);
    },
    [client, user],
  );

  useEffect(() => {
    if (!client) return;

    setLoadingCalls(true);
    client
      .queryCalls(queryCallsParams)
      .then((result) => {
        setCalls(result.calls);
        nextPointer.current = result.next;
      })
      .catch((err) => {
        setLoadingError(err);
      })
      .finally(() => setLoadingCalls(false));
  }, [client]);

  return (
    <>
      {client && (
        <StreamVideo client={client}>
          <CallsContext.Provider
            value={{
              joinedCall,
              setJoinedCall,
              calls,
              createCall,
              loadingCalls,
              loadingError,
              loadMoreCalls,
              setCalls,
            }}
          >
            {children}
          </CallsContext.Provider>
        </StreamVideo>
      )}
    </>
  );
};

export const useLoadedCalls = () => useContext(CallsContext);
