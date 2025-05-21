import { CSSProperties, ElementType, ReactNode } from 'react';
import useSWR from 'swr';

export function useValuePoller<T>(
  key: string,
  fetcher: () => T | Promise<T>,
  pollIntervalMs = 500,
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
      refreshWhenOffline: true,
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
  as?: ElementType;
  fetcher: () => ReactNode | Promise<ReactNode>;
  pollIntervalMs?: number;
  indicator?: ReactNode | ((value: ReactNode) => ReactNode);
}) {
  const { value, lastPollTimestamp, nextPollTimestamp } = useValuePoller(
    props.id,
    props.fetcher,
    props.pollIntervalMs,
  );

  if (typeof value === 'undefined') {
    return <div className="rd__value-poller">-</div>;
  }

  const animationDuration =
    nextPollTimestamp && lastPollTimestamp
      ? `${(nextPollTimestamp - lastPollTimestamp) / 1000}s`
      : undefined;
  const animationDelay = lastPollTimestamp
    ? `${(lastPollTimestamp - Date.now()) / 1000}s`
    : undefined;

  const Container = props.as ?? 'div';

  return (
    <Container
      className="rd__value-poller"
      style={
        {
          '--rd-value-poller-animation-duration': animationDuration,
          '--rd-value-poller-animation-delay': animationDelay,
        } as CSSProperties
      }
    >
      {value}
      {props.indicator && (
        <span className="rd__value-poller-indicator">
          {typeof props.indicator === 'function'
            ? props.indicator(value)
            : props.indicator}
        </span>
      )}
    </Container>
  );
}
