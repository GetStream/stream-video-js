import clsx from 'clsx';
import * as React from 'react';

export type LoadingIndicatorProps = {
  type?: string;
  text?: string;
};

export const LoadingIndicator = ({
  type = 'spinner',
  text,
}: LoadingIndicatorProps) => {
  return (
    <div className={clsx('str-video__loading-indicator', type)}>
      {text && <p className="str-video__loading-indicator-text">{text}</p>}
    </div>
  );
};
