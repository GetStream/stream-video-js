import clsx from 'clsx';

export type LoadingIndicatorProps = {
  className?: string;
  /** String will be injected into class and later used to apply as a CSS mask-image to an element as data URL */
  type?: string;
  /** Text to be displayed under the loading indicator icon */
  text?: string;
  /** Tooltip to be displayed on hover */
  tooltip?: string;
};

export const LoadingIndicator = ({
  className,
  type = 'spinner',
  text,
  tooltip,
}: LoadingIndicatorProps) => {
  return (
    <div
      className={clsx('str-video__loading-indicator', className)}
      title={tooltip}
    >
      <div className={clsx('str-video__loading-indicator__icon', type)}></div>
      {text && <p className="str-video__loading-indicator-text">{text}</p>}
    </div>
  );
};
