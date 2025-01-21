import clsx from 'clsx';

type NetworkStatusProps = {
  status: 'red' | 'yellow' | 'green' | 'neutral';
  children: React.ReactNode;
  className?: string;
};

export function NetworkStatus({
  status,
  children,
  className,
}: NetworkStatusProps) {
  let bars = undefined;

  bars = Array.from({ length: 12 }, (_, index) => {
    return (
      <div
        key={index}
        className={clsx('rd__network-bar', {
          'rd__network-bar--good': status === 'green' && index <= 12,
          'rd__network-bar--average': status === 'yellow' && index < 8,
          'rd__network-bar--bad': status === 'red' && index < 4,
          'rd__network-bar--neutral': status === 'neutral',
        })}
      />
    );
  });

  return (
    <div className={clsx('rd__network-status', className)}>
      <div className="rd__network-content">{children}</div>
      <div className="rd__network-bars">{bars}</div>
    </div>
  );
}
