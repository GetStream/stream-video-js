import { View, StyleSheet } from 'react-native';
import {
  useCallStateHooks,
  useConnectedUser,
} from '@stream-io/video-react-bindings';
import { useTheme } from '../../../contexts/ThemeContext';
import { LobbyCameraPreview } from './LobbyCameraPreview';
import { Avatar, PreviewStatusLabel } from '../..';

export type LobbyContentProps = {
  landscape?: boolean;
};

export const LobbyContent = ({ landscape = false }: LobbyContentProps) => {
  const connectedUser = useConnectedUser();
  const { useCameraState, useCallSettings } = useCallStateHooks();
  const callSettings = useCallSettings();
  const isVideoEnabledInCall = callSettings?.video.enabled;
  const { optimisticIsMute: cameraIsMuted } = useCameraState();
  const {
    theme: { lobby },
  } = useTheme();

  return (
    <>
      {connectedUser && isVideoEnabledInCall && (
        <View
          style={[
            landscape ? styles.landscapeContainer : styles.container,
            lobby.videoContainer,
          ]}
        >
          {!cameraIsMuted ? (
            <LobbyCameraPreview objectFit="cover" />
          ) : (
            <View style={[styles.avatarContainer, lobby.avatarContainer]}>
              <Avatar user={connectedUser} size="xl" />
            </View>
          )}
          <View style={[styles.statusContainer, lobby.statusContainer]}>
            <PreviewStatusLabel />
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 178 / 127,
    alignItems: 'center',
    overflow: 'hidden',
  },
  landscapeContainer: {
    height: '100%',
    aspectRatio: 178 / 127,
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
