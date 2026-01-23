import { lazy, Suspense } from 'react';
import { LoadingIndicator } from '@stream-io/video-react-sdk';

const DefaultCallUI = lazy(() => import('../DefaultCall/DefaultCallUI'));
const LivestreamUI = lazy(() => import('../LivestreamUI/LivestreamUI'));

type CallUIProps = {
  callType: string;
  skipLobby?: boolean;
};

const LoadingScreen = () => (
  <div className="str-video__call">
    <div className="str-video__call__loading-screen">
      <LoadingIndicator />
    </div>
  </div>
);

export const CallUI = ({ callType, skipLobby }: CallUIProps) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      {callType === 'livestream' ? (
        <LivestreamUI />
      ) : (
        <DefaultCallUI skipLobby={skipLobby} />
      )}
    </Suspense>
  );
};
