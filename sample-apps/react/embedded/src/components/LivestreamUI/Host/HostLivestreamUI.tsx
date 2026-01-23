import { PaginatedGridLayout } from '@stream-io/video-react-sdk';

import { HostHeader } from './HostHeader';
import { HostControls } from './HostControls';

export const HostLivestreamUI = () => {
  return (
    <div className="rd__call rd__host-livestream">
      <HostHeader />
      <PaginatedGridLayout />
      <HostControls />
    </div>
  );
};
