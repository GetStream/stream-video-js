import { Icon } from '@stream-io/video-react-sdk';
import Link from 'next/link';
import clsx from 'clsx';
import { useState, useCallback } from 'react';

type NetworkStatusProps = {
  status: number;
  children: React.ReactNode;
};

export function NetworkStatus({ status, children }: NetworkStatusProps) {
  const bars = Array.from({ length: 12 }, (_, index) => {
    // Calculate if this bar should be active based on status
    // Each bar represents ~8.33% (100/12)
    const good = (index + 1) * 8.33 <= status;
    const average = (index + 1) * 8.33 > status && (index + 1) * 8.33 < status;
    const bad = (index + 1) * 8.33 > status;

    return (
      <div
        key={index}
        className={clsx('rd__network-bar', {
          'rd__network-bar--good': good,
          'rd__network-bar--average': average,
          'rd__network-bar--bad': bad,
        })}
      />
    );
  });

  return (
    <div className="rd__network-status">
      {children}
      <div className="rd__network-bars">{bars}</div>
    </div>
  );
}

type CardProps = {
  title?: string;
  tooltip?: string;
  link?: string;
  children: React.ReactNode;
  variant?: 'parent' | 'child';
};

export function Card({
  tooltip,
  link,
  title,
  children,
  variant = 'child',
}: CardProps) {
  return (
    <div
      className={clsx('rd__card', {
        'rd__card--parent': variant === 'parent',
      })}
    >
      {title && <h3>{title}</h3>}
      {tooltip && <Tooltip explanation={tooltip} />}
      {link && (
        <Link href={link} target="_blank">
          {link}
        </Link>
      )}
      {children}
    </div>
  );
}

type BadgeProps = {
  children: React.ReactNode;
  status?: 'good' | 'average' | 'bad';
  variant?: 'small' | 'large';
  link?: string;
};

export function LinkBadge({ children, link, ...rest }: BadgeProps) {
  if (!link) {
    return <Badge {...rest}>{children}</Badge>;
  }

  return (
    <Link href={link} target="_blank">
      <Badge {...rest}>{children}</Badge>
    </Link>
  );
}

export function Badge({ children, status, variant }: BadgeProps) {
  return (
    <div
      className={clsx('rd__badge', {
        'rd__badge--small': variant === 'small',
        'rd__badge--large': variant === 'large',
      })}
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

type TooltipProps = {
  explanation: string;
};

export const Tooltip = ({ explanation }: TooltipProps) => {
  return (
    <div className="rd__tooltip">
      <p>{explanation}</p>
      <Icon icon="info" />
    </div>
  );
};

type RatingProps = {
  rating: { current: number; maxAmount: number };
  handleSetRating: (value: number) => void;
};

export function Rating({ rating, handleSetRating }: RatingProps) {
  return (
    <div className="rd__feedback-rating-stars">
      {[...new Array(rating.maxAmount)].map((_, index) => {
        const grade = index + 1;
        const active = grade <= rating.current;
        const color = (v: number) =>
          v <= 2 ? 'bad' : v > 2 && v <= 4 ? 'good' : 'great';
        const modifier = color(grade);
        const activeModifier = color(rating.current);
        return (
          <div key={index} onClick={() => handleSetRating(grade)}>
            <Icon
              icon="star"
              className={clsx(
                'rd__feedback-star',
                `rd__feedback-star--${modifier}`,
                active && `rd__feedback-star--active-${activeModifier}`,
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function EndCallSummary() {
  const [rating, setRating] = useState({ current: 0, maxAmount: 5 });

  const handleSetRating = useCallback((value: number) => {
    setRating((currentRating) => ({ ...currentRating, current: value }));
  }, []);

  return (
    <div className="rd__leave">
      <div>
        <Card title="Call Quality" tooltip="Call Quality">
          <Badge status="bad" variant="large">
            36%
          </Badge>
        </Card>
        <Card title="Time to connect" tooltip="Call Quality">
          <Badge status="average" variant="large">
            5s
          </Badge>
        </Card>
        <Card title="Latency average" tooltip="Call Quality">
          <Badge status="bad" variant="large">
            145ms
          </Badge>
        </Card>
        <Card title="Video Codex" tooltip="Call Quality">
          <Badge variant="large">VP9</Badge>
          <Badge variant="large">VP8</Badge>
        </Card>
      </div>

      <div>
        <Card title="User Network" tooltip="">
          <NetworkStatus status={80}>
            <Badge variant="small">Network</Badge>
          </NetworkStatus>
          <NetworkStatus status={20}>
            <Badge variant="small">Device</Badge>
          </NetworkStatus>
        </Card>
        <Card title="Video & Audio products" link="https://getstream.io/video/">
          <div>
            <LinkBadge variant="small">Video Calling</LinkBadge>
            <LinkBadge variant="small">Live Stream</LinkBadge>
            <LinkBadge variant="small">Audio Calling</LinkBadge>
            <LinkBadge variant="small">Audio Rooms</LinkBadge>
          </div>
        </Card>
        <Card>
          <h2>How Was your Call Experience?</h2>
          <Rating rating={rating} handleSetRating={handleSetRating} />
        </Card>
      </div>

      <div>
        <Card variant="parent">
          <Card title="Edge networks used" tooltip="Call Quality">
            <NetworkStatus status={80}>
              <Badge variant="small">Amsterdam</Badge>
            </NetworkStatus>
            <NetworkStatus status={80}>
              <Badge variant="small">Boston</Badge>
            </NetworkStatus>
          </Card>
          <Card title="Edge servers available" tooltip="Call Quality">
            <NetworkStatus status={80}>
              <Badge variant="small">Frankfurt</Badge>
            </NetworkStatus>
            <NetworkStatus status={80}>
              <Badge variant="small">San Francisco</Badge>
            </NetworkStatus>
          </Card>
        </Card>
      </div>
    </div>
  );
}
