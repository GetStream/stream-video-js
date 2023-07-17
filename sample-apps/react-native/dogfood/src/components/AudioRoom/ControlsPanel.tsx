import {
  CallingState,
  OwnCapability,
  Restricted,
  SfuModels,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useHasPermissions,
  useIsCallLive,
  useLocalParticipant,
  useMediaStreamManagement,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

export const ControlsPanel = () => {
  return (
    <View style={styles.container}>
      <ToggleAudioButton />
      <LiveButtons />
    </View>
  );
};

const LiveButtons = () => {
  // this utility hook returns the call object from the <StreamCall /> context
  const call = useCall();
  // this utility hook is a wrapper around the `call.state.metadata$` observable,
  // and it will emit a new value whenever the call goes live or stops being live.
  // we can use it to update the button text or adjust any other UI elements
  const isLive = useIsCallLive();

  const callingState = useCallCallingState();

  const canJoin = ![
    CallingState.JOINING,
    CallingState.JOINED,
    CallingState.LEFT,
  ].includes(callingState);

  if (!call) {
    return null;
  }

  return (
    <>
      {isLive && (
        <>
          <Restricted
            hasPermissionsOnly
            requiredGrants={[OwnCapability.END_CALL]}
          >
            <Button
              title={'Stop Live and Leave'}
              onPress={async () => {
                try {
                  await call.stopLive();
                  await call.leave();
                } catch (error) {
                  console.log('Error Stop Live:', error);
                }
              }}
            />
          </Restricted>
          {canJoin && (
            <Button
              title={'Join the live call'}
              onPress={() => {
                call.join();
              }}
            />
          )}
        </>
      )}
      {!isLive && (
        <Restricted
          hasPermissionsOnly
          requiredGrants={[OwnCapability.JOIN_BACKSTAGE]}
        >
          <Button
            title={'Start Live and Join'}
            onPress={async () => {
              try {
                await call.goLive();
                await call.join();
              } catch (error) {
                console.log('Error Start Live and Join:', error);
              }
            }}
          />
        </Restricted>
      )}
    </>
  );
};

const ToggleAudioButton = () => {
  const { publishAudioStream, stopPublishingAudio } =
    useMediaStreamManagement();
  const call = useCall();
  const connectedUser = useConnectedUser();

  const localParticipant = useLocalParticipant();
  const isMuted = !localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const hasPermission = useHasPermissions(OwnCapability.SEND_AUDIO);
  const canRequestSpeakingPermissions = call?.permissionsContext.canRequest(
    OwnCapability.SEND_AUDIO,
  );
  const [isAwaitingAudioApproval, setIsAwaitingAudioApproval] = useState(false);

  let title = 'Mute';
  if (!hasPermission) {
    title = 'Ask permission to send audio';
  } else if (isMuted) {
    title = 'Unmute';
  }

  useEffect(() => {
    if (!(call && connectedUser)) {
      return;
    }
    return call.on('call.permissions_updated', (event) => {
      if (event.type !== 'call.permissions_updated') {
        return;
      }
      if (connectedUser.id !== event.user.id) {
        return;
      }
      setIsAwaitingAudioApproval(false);
      // automatically publish/unpublish audio stream based on the new permissions
      if (event.own_capabilities.includes(OwnCapability.SEND_AUDIO)) {
        publishAudioStream();
      } else {
        stopPublishingAudio();
      }
    });
  }, [call, connectedUser, publishAudioStream, stopPublishingAudio]);

  if (
    isAwaitingAudioApproval ||
    (!canRequestSpeakingPermissions && !hasPermission)
  ) {
    return null;
  }

  const onPress = () => {
    if (!hasPermission) {
      setIsAwaitingAudioApproval(true);
      call
        ?.requestPermissions({
          permissions: [OwnCapability.SEND_AUDIO],
        })
        .catch((err) => {
          setIsAwaitingAudioApproval(false);
          console.log('RequestPermissions failed', err);
        });
    } else if (isMuted) {
      publishAudioStream().catch((err) => {
        console.error('Error publishing audio stream', err);
      });
    } else {
      stopPublishingAudio();
    }
  };

  return <Button title={title} onPress={onPress} />;
};

const styles = StyleSheet.create({
  container: {
    // flexDirection: 'row',
    alignSelf: 'center',
  },
});
