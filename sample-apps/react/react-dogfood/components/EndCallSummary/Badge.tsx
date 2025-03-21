import Link from 'next/link';
import clsx from 'clsx';

export enum Status {
  GOOD = 'good',
  AVERAGE = 'average',
  BAD = 'bad',
}

type BadgeProps = {
  children: React.ReactNode;
  status?: Status;
  variant?: 'small' | 'large';
  fit?: 'fill' | 'contain';
  link?: string;
  className?: string;
  hasLink?: boolean;
};

export function LinkBadge({ children, link, className, ...rest }: BadgeProps) {
  if (!link) {
    return (
      <Badge {...rest} className={className}>
        {children}
      </Badge>
    );
  }

  return (
    <Link className={className} href={link} target="_blank">
      <Badge {...rest} className={className} hasLink={true}>
        {children}
      </Badge>
    </Link>
  );
}

export function Badge({
  children,
  status,
  variant,
  className,
  fit = 'contain',
  hasLink = false,
}: BadgeProps) {
  return (
    <div
      className={clsx(
        'rd__badge',
        {
          'rd__badge--small': variant === 'small',
          'rd__badge--large': variant === 'large',
          'rd__badge--fill': fit === 'fill',
          'rd__badge--contain': fit === 'contain',
          'rd__badge--link': hasLink,
        },
        className,
      )}
    >
      {status && (
        <span
          className={clsx('rd__badge-status', {
            'rd__badge-status--good': status === 'good',
            'rd__badge-status--average': status === 'average',
            'rd__badge-status--bad': status === 'bad',
          })}
        ></span>
      )}
      {children}
    </div>
  );
}
