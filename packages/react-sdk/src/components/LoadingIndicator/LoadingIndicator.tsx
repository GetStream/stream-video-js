import clsx from 'clsx';

export type LoadingIndicatorProps = {
  /** String will be injected into class and later used to apply as a CSS mask-image to an element as data URL */
  type?: string;
  /** Text to be displayed under the loading indicator icon */
  text?: string;
  /** Tooltip to be displayed on hover */
  tooltip?: string;
};

export const LoadingIndicator = ({
  type = 'spinner',
  text,
  tooltip,
}: LoadingIndicatorProps) => {
  return (
    <div className="str-video__loading-indicator" title={tooltip}>
      <div className={clsx('str-video__loading-indicator__icon', type)}></div>
      {text && <p className="str-video__loading-indicator-text">{text}</p>}
    </div>
  );
};
