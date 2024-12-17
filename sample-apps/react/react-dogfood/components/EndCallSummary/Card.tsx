import Link from 'next/link';
import clsx from 'clsx';
import { WithTooltip, Icon } from '@stream-io/video-react-sdk';

type CardProps = {
  title?: string;
  tooltip?: string;
  link?: string;
  children: React.ReactNode;
  variant?: 'parent' | 'child';
  contentVariant?: 'row' | 'column';
  style?: React.CSSProperties;
  className?: string;
};

export function Card({
  tooltip,
  link,
  title,
  children,
  variant = 'child',
  contentVariant = 'column',
  style,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(
        'rd__card',
        className,
        {
          'rd__card--parent': variant === 'parent',
        },
        className,
      )}
      style={style}
    >
      {title || tooltip || link ? (
        <div className="rd__card--header">
          {title && <h3 className="rd__card--title">{title}</h3>}
          {tooltip && (
            <WithTooltip className="rd__card--tooltip" title={tooltip}>
              <Icon icon="info" />
            </WithTooltip>
          )}
          {link && (
            <Link className="rd__card--link" href={link} target="_blank">
              <Icon icon="new-tab" />
            </Link>
          )}
        </div>
      ) : null}
      <div
        className={clsx('rd__card--content', {
          'rd__card--content-row': contentVariant === 'row',
          'rd__card--content-column': contentVariant === 'column',
        })}
      >
        {children}
      </div>
    </div>
  );
}
