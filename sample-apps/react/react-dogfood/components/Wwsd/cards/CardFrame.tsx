import { IconButton } from '@stream-io/video-react-sdk';
import { PropsWithChildren } from 'react';

export const CardFrame = (
  props: PropsWithChildren<{
    icon: string;
    title: string;
    model?: string;
    badge?: string;
    onDismiss: () => void;
  }>,
) => {
  const { icon, title, model, badge, onDismiss, children } = props;
  return (
    <div className="rd__wwsd-card">
      <div className="rd__wwsd-card__header">
        <span aria-hidden>{icon}</span>
        <span className="rd__wwsd-card__title">{title}</span>
        {badge && <span className="rd__wwsd-chip">{badge}</span>}
        {model && <span className="rd__wwsd-chip">AI · {model}</span>}
        <IconButton
          onClick={onDismiss}
          size="sm"
          variant="secondary"
          appearance="ghost"
          icon="close"
        />
      </div>
      <div className="rd__wwsd-card__body">{children}</div>
    </div>
  );
};

export const SayThis = (props: { text?: string; label?: string }) =>
  props.text ? (
    <p className="rd__wwsd-say">
      <b>{props.label ?? 'Say:'}</b> {props.text}
    </p>
  ) : null;

export const Quote = (props: { text?: string }) =>
  props.text ? <p className="rd__wwsd-quote">“{props.text}”</p> : null;
