import { humanize } from '@stream-io/video-client';
import { Icon } from '../../../components';

interface ViewersCountProps {
  count: number;
}

export const ViewersCount = ({ count }: ViewersCountProps) => (
  <div className="str-video__embedded-livestream-duration__viewers">
    <Icon
      icon="eye"
      className="str-video__embedded-livestream-duration__eye-icon"
    />
    <span className="str-video__embedded-livestream-duration__count">
      {humanize(count)}
    </span>
  </div>
);
