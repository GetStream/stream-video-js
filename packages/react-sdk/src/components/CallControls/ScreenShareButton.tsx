import * as React from 'react';
import { Call, getScreenShareStream, SfuModels } from '@stream-io/video-client';
import { Button } from './Button';
import { useLocalParticipant } from '@stream-io/video-react-bindings';

export type ScreenShareButtonProps = {
  call: Call;
};

export const ScreenShareButton = ({ call }: ScreenShareButtonProps) => {
  const localParticipant = useLocalParticipant();
  const isScreenSharing = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );
  return (
    <Button
      icon={isScreenSharing ? 'screen-share-on' : 'screen-share-off'}
      title="Share screen"
      onClick={async () => {
        if (!isScreenSharing) {
          const stream = await getScreenShareStream().catch((e) => {
            console.log(`Can't share screen: ${e}`);
          });
          if (stream) {
            await call.publishScreenShareStream(stream);
          }
        } else {
          await call.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
        }
      }}
    />
  );
};
