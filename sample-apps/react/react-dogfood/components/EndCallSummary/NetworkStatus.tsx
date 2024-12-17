import clsx from 'clsx';

type NetworkStatusProps = {
  status: number | 'red' | 'yellow' | 'green';
  children: React.ReactNode;
};

export function NetworkStatus({ status, children }: NetworkStatusProps) {
  let bars = undefined;

  if (typeof status === 'number') {
    const threshold = 8.33;
    const bad = threshold * 0 < status; // First 2 bars
    const average = threshold * 3 < status; // Bars 3-4
    const good = threshold * 8 < status; // Bars 5-12

    bars = Array.from({ length: 12 }, (_, index) => {
      return (
        <div
          key={index}
          className={clsx('rd__network-bar', {
            'rd__network-bar--good':
              good && average && bad && index * 10 <= status,
            'rd__network-bar--average':
              average && bad && !good && index * 10 <= status,
            'rd__network-bar--bad':
              bad && !average && !good && index * 10 <= status,
          })}
        />
      );
    });
  } else {
    bars = Array.from({ length: 12 }, (_, index) => {
      return (
        <div
          key={index}
          className={clsx('rd__network-bar', {
            'rd__network-bar--good': status === 'green' && index < 12,
            'rd__network-bar--average': status === 'yellow' && index < 8,
            'rd__network-bar--bad': status === 'red' && index < 4,
          })}
        />
      );
    });
  }

  return (
    <div className="rd__network-status">
      {children}
      <div className="rd__network-bars">{bars}</div>
    </div>
  );
}
