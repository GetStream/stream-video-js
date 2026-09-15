import { Icon } from '../../../components';

interface CallDurationProps {
  elapsed: string;
}

export const CallDuration = ({ elapsed }: CallDurationProps) => {
  if (!elapsed) return null;

  const secondsAt = elapsed.lastIndexOf(':') + 1;
  const leading = elapsed.slice(0, secondsAt);
  const seconds = elapsed.slice(secondsAt);

  return (
    <div className="str-video__embedded-call-duration">
      <Icon
        icon="verified"
        className="str-video__embedded-call-duration__icon"
      />
      <span className="str-video__embedded-call-duration__time">
        <span className="str-video__embedded-call-duration__time-leading">
          {leading}
        </span>
        {seconds}
      </span>
    </div>
  );
};
