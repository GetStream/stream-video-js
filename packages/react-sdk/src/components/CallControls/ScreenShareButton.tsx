import { useEffect, useState } from 'react';
import {
  getScreenShareStream,
  OwnCapability,
  SfuModels,
} from '@stream-io/video-client';
import {
  Restricted,
  useCall,
  useHasOngoingScreenShare,
  useHasPermissions,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';
import { CompositeButton, IconButton } from '../Button/';
import { PermissionNotification } from '../Notification';

export type ScreenShareButtonProps = {
  caption?: string;
};

export const ScreenShareButton = ({
  caption = 'Screen Share',
}: ScreenShareButtonProps) => {
  const call = useCall();
  const localParticipant = useLocalParticipant();
  const isSomeoneScreenSharing = useHasOngoingScreenShare();
  const isScreenSharing = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.SCREEN_SHARE,
  );

  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
  const hasPermission = useHasPermissions(OwnCapability.SCREENSHARE);
  useEffect(() => {
    if (hasPermission) {
      setIsAwaitingApproval(false);
    }
  }, [hasPermission]);
  return (
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <PermissionNotification
        permission={OwnCapability.SCREENSHARE}
        isAwaitingApproval={isAwaitingApproval}
        messageApproved="You can now share your screen."
        messageAwaitingApproval="Awaiting for an approval to share screen."
        messageRevoked="You can no longer share your screen."
      >
        <CompositeButton active={isSomeoneScreenSharing} caption={caption}>
          <IconButton
            icon={isScreenSharing ? 'screen-share-on' : 'screen-share-off'}
            title="Share screen"
            disabled={(!isScreenSharing && isSomeoneScreenSharing) || !call}
            onClick={async () => {
              if (
                !hasPermission &&
                call?.permissionsContext.canRequest(OwnCapability.SCREENSHARE)
              ) {
                setIsAwaitingApproval(true);
                await call
                  .requestPermissions({
                    permissions: [OwnCapability.SCREENSHARE],
                  })
                  .catch((reason) => {
                    console.log('RequestPermissions failed', reason);
                  });
                return;
              }

              if (!isScreenSharing && hasPermission) {
                const stream = await getScreenShareStream().catch((e) => {
                  console.log(`Can't share screen: ${e}`);
                });
                if (stream) {
                  await call?.publishScreenShareStream(stream);
                }
              } else {
                await call?.stopPublish(SfuModels.TrackType.SCREEN_SHARE);
              }
            }}
          />
        </CompositeButton>
      </PermissionNotification>
    </Restricted>
  );
};
