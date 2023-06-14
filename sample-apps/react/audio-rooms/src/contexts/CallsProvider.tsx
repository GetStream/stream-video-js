import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Call,
  ChildrenOnly,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';
import { useUserContext } from './UserContext';

const CALL_TYPE = 'audio_room';

type CreateCallParams = {
  title: string;
  description: string;
};

type CallContext = {
  joinedCall?: Call;
  setJoinedCall: (call?: Call) => void;
  calls: Call[];
  createCall: ({ description, title }: CreateCallParams) => void;
  leaveCall: (call: Call) => Promise<void>;
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
  leaveCall: () => Promise.resolve(),
  loadingCalls: false,
  loadMoreCalls: () => Promise.resolve(),
  setCalls: noop,
});

const queryCallsParams = {
  filter_conditions: { type: CALL_TYPE },
  sort: [],
  watch: true,
  limit: 25,
};

export const CallsProvider = ({ children }: ChildrenOnly) => {
  const { user } = useUserContext();
  const client = useStreamVideoClient();
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
      const randomId = Math.random().toString(36).substring(2, 12);
      const call = client.call(CALL_TYPE, randomId);
      await call.getOrCreate({
        data: {
          members: [{ user_id: user.id, role: 'admin' }],
          custom: {
            title: title,
            description: description,
            hosts: [user],
          },
        },
      });
      setCalls((prevCalls) => [call, ...prevCalls]);
    },
    [client, user],
  );

  const leaveCall = useCallback(
    async (call: Call) => {
      if (!client) return;

      await call.leave();
      const newCall = client.call(call.type, call.id);
      await newCall.get();

      setCalls((prevCalls) => [
        ...prevCalls.map((c) => {
          return c.cid === call.cid ? newCall : c;
        }),
      ]);
    },
    [client],
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
    <CallsContext.Provider
      value={{
        joinedCall,
        setJoinedCall,
        calls,
        createCall,
        leaveCall,
        loadingCalls,
        loadingError,
        loadMoreCalls,
        setCalls,
      }}
    >
      {children}
    </CallsContext.Provider>
  );
};

export const useLoadedCalls = () => useContext(CallsContext);
