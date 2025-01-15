import { ReactNode } from 'react';
import useSWR from 'swr';

export function useValuePoller<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  pollIntervalMs = 1000,
) {
  const { data } = useSWR(
    key,
    async () => {
      return {
        value: await fetcher(),
        lastPollTimestamp: Date.now(),
        nextPollTimestamp: Date.now() + pollIntervalMs,
      };
    },
    {
      refreshInterval: pollIntervalMs,
      revalidateOnFocus: false,
    },
  );

  return {
    value: data?.value,
    lastPollTimestamp: data?.lastPollTimestamp,
    nextPollTimestamp: data?.nextPollTimestamp,
  };
}

export function ValuePoller(props: {
  id: string;
  fetcher: () => ReactNode | Promise<ReactNode>;
  pollIntervalMs?: number;
}) {
  const { value, lastPollTimestamp, nextPollTimestamp } = useValuePoller(
    props.id,
    props.fetcher,
    props.pollIntervalMs,
  );

  if (typeof value === 'undefined') {
    return <div>-</div>;
  }

  const animationDuration =
    nextPollTimestamp && lastPollTimestamp
      ? `${(nextPollTimestamp - lastPollTimestamp) / 1000}s`
      : undefined;
  const animationDelay = lastPollTimestamp
    ? `${(lastPollTimestamp - Date.now()) / 1000}s`
    : undefined;

  return (
    <div
      className="rd__value-poller"
      style={{
        animationDuration,
        animationDelay,
      }}
    >
      {value}
    </div>
  );
}
