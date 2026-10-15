import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { resolveBackendUrl } from './config';
import { cardKey, CardEntry, WwsdState } from './reducer';
import { FeedStatus, useWwsdFeed } from './useWwsdFeed';
import { ListenStatus, useWwsdActions, WwsdActions } from './useWwsdActions';
import { createWwsdApi } from './wwsdApi';

export type WwsdContextValue = {
  backendUrl: string;
  callId: string;
  state: WwsdState;
  status: FeedStatus;
  listenStatus: ListenStatus;
  error: string | null;
  clearError: () => void;
  isPending: (name: string) => boolean;
  isDismissed: (card: CardEntry) => boolean;
  dismissCard: (card: CardEntry) => void;
  actions: WwsdActions;
};

const WwsdContext = createContext<WwsdContextValue | null>(null);

export const useWwsd = () => {
  const value = useContext(WwsdContext);
  if (!value) throw new Error('useWwsd must be used inside <WwsdProvider>');
  return value;
};

type WwsdProviderProps = PropsWithChildren<{
  enabled: boolean;
  callId: string;
}>;

export const WwsdProvider = ({
  enabled,
  callId,
  children,
}: WwsdProviderProps) =>
  enabled ? (
    <WwsdProviderInner callId={callId}>{children}</WwsdProviderInner>
  ) : (
    <>{children}</>
  );

const WwsdProviderInner = ({
  callId,
  children,
}: PropsWithChildren<{ callId: string }>) => {
  const [backendUrl] = useState(() => resolveBackendUrl());
  const [api] = useState(() => createWwsdApi(backendUrl, callId));
  const { state, status } = useWwsdFeed(api.eventsUrl);
  const { actions, pending, error, clearError, listenStatus } = useWwsdActions(
    api,
    backendUrl,
    callId,
  );
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const value: WwsdContextValue = {
    backendUrl,
    callId,
    state,
    status,
    listenStatus,
    error,
    clearError,
    isPending: (name) => !!pending[name],
    isDismissed: (card) => dismissed.has(cardKey(card)),
    dismissCard: (card) =>
      setDismissed((prev) => new Set(prev).add(cardKey(card))),
    actions,
  };

  return <WwsdContext.Provider value={value}>{children}</WwsdContext.Provider>;
};
