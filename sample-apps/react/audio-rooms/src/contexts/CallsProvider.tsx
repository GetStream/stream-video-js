import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Call } from '@stream-io/video-client';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { ChildrenOnly } from '@stream-io/video-react-sdk';
import { noop } from '../utils/noop';

type CallContext = {
  calls: Call[];
  loadingCalls: boolean;
  loadMoreCalls: () => Promise<void>;
  setCalls: (calls: Call[]) => void;
  loadingError?: Error;
};

const CallsContext = createContext<CallContext>({
  calls: [],
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

export const CallsProvider = ({ children }: ChildrenOnly) => {
  const client = useStreamVideoClient();
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
        calls,
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

export const useCalls = () => useContext(CallsContext);
