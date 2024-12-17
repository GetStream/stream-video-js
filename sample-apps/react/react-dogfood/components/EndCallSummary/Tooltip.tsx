import { Icon } from '@stream-io/video-react-sdk';

type TooltipProps = {
  explanation: string;
};

export const Tooltip = ({ explanation }: TooltipProps) => {
  return (
    <div className="rd__tooltip">
      {/* <p>{explanation}</p> */}
      <Icon icon="info" />
    </div>
  );
};
