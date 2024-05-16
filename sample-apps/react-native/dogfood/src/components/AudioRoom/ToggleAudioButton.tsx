import {
  hasAudio,
  OwnCapability,
  useCall,
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-native';

export default function ToggleAudioButton() {
  const call = useCall();
  const connectedUser = useConnectedUser();

  const { useLocalParticipant, useHasPermissions } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const isMuted = localParticipant && !hasAudio(localParticipant);
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
      setIsAwaitingAudioApproval(false);
      // automatically publish/unpublish audio stream based on the new permissions
      if (event.own_capabilities.includes(OwnCapability.SEND_AUDIO)) {
        call.microphone.enable();
      } else {
        call.microphone.disable();
      }
    });
  }, [call, connectedUser]);

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
      call?.microphone.enable().catch((err) => {
        console.error('Error publishing audio stream', err);
      });
    } else {
      call?.microphone.disable();
    }
  };

  return <Button title={title} onPress={onPress} />;
}
